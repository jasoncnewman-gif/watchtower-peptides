#!/usr/bin/env python3
"""
Polls an IMAP inbox for a one-time-code email and prints the extracted code.

Usage: fetch-otp.py <host> <user> <password> <sender_substring> <since_epoch> <timeout_seconds>

Requires the email's Date header to be >= since_epoch (minus small clock-skew
tolerance) — NOT just "newest in inbox". These OTP systems invalidate older
codes once a newer one is issued ("only the newest code works"), so grabbing
whatever's newest-in-window without confirming it's actually newer than this
specific request can return an already-superseded code. If no new email
shows up (e.g. the site silently rate-limited a too-frequent resend click),
this correctly times out rather than returning a stale code — the caller
should click resend again after the cooldown and retry with a fresh
since_epoch.

Exits 0 and prints the code on stdout when found, exits 1 with a message on
stderr on timeout. Polls every 3s rather than hammering the server.
"""
import email
import imaplib
import re
import sys
import time
from email.header import decode_header


def decode(value: str) -> str:
    parts = decode_header(value)
    return "".join(
        p.decode(enc or "utf-8", errors="ignore") if isinstance(p, bytes) else p
        for p, enc in parts
    )


def body_text(msg: email.message.Message) -> str:
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                charset = part.get_content_charset() or "utf-8"
                return part.get_payload(decode=True).decode(charset, errors="ignore")
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                charset = part.get_content_charset() or "utf-8"
                return part.get_payload(decode=True).decode(charset, errors="ignore")
        return ""
    charset = msg.get_content_charset() or "utf-8"
    payload = msg.get_payload(decode=True)
    return payload.decode(charset, errors="ignore") if payload else ""


def main() -> int:
    host, user, password, sender_substring, since_epoch, timeout_s = sys.argv[1:7]
    since_epoch = float(since_epoch)
    deadline = time.time() + float(timeout_s)

    while time.time() < deadline:
        m = imaplib.IMAP4_SSL(host, 993, timeout=15)
        try:
            m.login(user, password)
            m.select("INBOX")
            status, data = m.search(None, "ALL")
            uids = data[0].split() if data and data[0] else []
            for uid in reversed(uids[-20:]):  # newest first, cap the scan
                status, msg_data = m.fetch(uid, "(RFC822)")
                if status != "OK" or not msg_data or not msg_data[0]:
                    continue
                msg = email.message_from_bytes(msg_data[0][1])
                from_header = decode(msg.get("From", ""))
                if sender_substring.lower() not in from_header.lower():
                    continue
                msg_time = email.utils.mktime_tz(
                    email.utils.parsedate_tz(msg.get("Date", ""))
                )
                if msg_time < since_epoch - 5:  # small clock-skew tolerance
                    continue
                text = decode(msg.get("Subject", "")) + "\n" + body_text(msg)
                # Strip HTML tags (and anything inside them, e.g. style="color:#171717")
                # so a hex color or other markup attribute can't be mistaken for the code.
                visible_text = re.sub(r"<[^>]+>", " ", text)
                match = re.search(r"\b(\d{4,8})\b", visible_text)
                if match:
                    print(match.group(1))
                    return 0
        finally:
            try:
                m.logout()
            except Exception:
                pass
        time.sleep(3)

    print(f"Timed out after {timeout_s}s waiting for OTP email from '{sender_substring}'", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
