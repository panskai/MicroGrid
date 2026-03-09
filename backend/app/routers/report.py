"""
routers/report.py — POST /api/send-report
"""
from __future__ import annotations
import base64, os, smtplib, traceback
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders

from fastapi import APIRouter
from app.schemas.report import SendReportRequest, SendReportResponse
from app.services.excel_builder import build_excel
from app.core import config as cfg

router = APIRouter(prefix="/api", tags=["report"])


@router.post("/send-report", response_model=SendReportResponse)
async def send_report(req: SendReportRequest):
    """
    生成配置方案 Excel 并：
      1. 返回 base64 供前端下载
      2. 若配置了 SMTP，则发送邮件至客户
    """
    try:
        excel_bytes = build_excel(req)
        b64 = base64.b64encode(excel_bytes).decode()

        email_sent  = False
        email_error = ""

        if cfg.SMTP_HOST and cfg.SMTP_USER and cfg.SMTP_PASS and req.contact.email:
            try:
                sc = req.systemConfig or {}
                c  = req.contact
                subject = f"VoltageEnergy Microgrid Solution Report — {sc.get('pvCapacityKw', '—')} kW PV"
                body = (
                    f"Dear {c.firstName} {c.lastName},\n\n"
                    "Thank you for using VoltageEnergy™ Microgrid Advisor.\n\n"
                    "Please find attached your Microgrid Solution Configuration Report, including:\n"
                    "  • System configuration parameters\n"
                    "  • Detailed Bill of Materials (BOM)\n"
                    "  • CAPEX cost breakdown\n"
                    "  • 20-year economic analysis\n\n"
                    "For further information or to schedule an on-site assessment:\n"
                    "  Email: sales@voltageenergy.com\n"
                    "  Web:   www.voltageenergy.com\n\n"
                    "VoltageEnergy™ | Energy For Future\n"
                )
                msg = MIMEMultipart()
                msg["From"]    = cfg.SMTP_FROM
                msg["To"]      = c.email
                msg["Subject"] = subject
                msg.attach(MIMEText(body, "plain", "utf-8"))

                part = MIMEBase("application",
                                "vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                part.set_payload(excel_bytes)
                encoders.encode_base64(part)
                part.add_header("Content-Disposition",
                                'attachment; filename="VoltageEnergy_Microgrid_Report.xlsx"')
                msg.attach(part)

                with smtplib.SMTP(cfg.SMTP_HOST, cfg.SMTP_PORT) as srv:
                    srv.starttls()
                    srv.login(cfg.SMTP_USER, cfg.SMTP_PASS)
                    srv.sendmail(cfg.SMTP_FROM, c.email, msg.as_string())
                email_sent = True

            except Exception as e:
                email_error = str(e)

        return SendReportResponse(
            success        = True,
            fileBase64     = b64,
            fileName       = "VoltageEnergy_Microgrid_Report.xlsx",
            emailSent      = email_sent,
            emailError     = email_error,
            smtpConfigured = bool(cfg.SMTP_HOST),
        )

    except Exception as exc:
        return SendReportResponse(success=False, error=str(exc))
