from django.http import HttpResponse
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from admin_panel.models import ActivityLog
from admin_panel.utils import log_activity

from . import exporters
from .models import Report
from .serializers import ReportDetailSerializer, ReportListSerializer
from .services import create_report, report_to_dict


class ReportViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.DestroyModelMixin,
                    viewsets.GenericViewSet):
    """
    GET    /api/reports/                 list my reports
    POST   /api/reports/generate/        generate a new report from my current portfolio
    GET    /api/reports/<id>/            view one report
    GET    /api/reports/<id>/pdf/        download PDF
    GET    /api/reports/<id>/csv/        download CSV
    DELETE /api/reports/<id>/            delete a report
    """

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Report.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        return ReportListSerializer if self.action == "list" else ReportDetailSerializer

    @action(detail=False, methods=["post"])
    def generate(self, request):
        report = create_report(request.user)
        log_activity(request, request.user, ActivityLog.Action.REPORT_GENERATED, f"Generated '{report.title}'")
        return Response(ReportDetailSerializer(report).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        report = self.get_object()
        content = exporters.build_pdf(report_to_dict(report))
        log_activity(request, request.user, ActivityLog.Action.REPORT_DOWNLOADED, f"PDF of report #{report.id}")
        response = HttpResponse(content, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="portfolio_report_{report.id}.pdf"'
        return response

    @action(detail=True, methods=["get"])
    def csv(self, request, pk=None):
        report = self.get_object()
        content = exporters.build_csv(report_to_dict(report))
        log_activity(request, request.user, ActivityLog.Action.REPORT_DOWNLOADED, f"CSV of report #{report.id}")
        response = HttpResponse("﻿" + content, content_type="text/csv; charset=utf-8")  # BOM: Excel-friendly
        response["Content-Disposition"] = f'attachment; filename="portfolio_report_{report.id}.csv"'
        return response
