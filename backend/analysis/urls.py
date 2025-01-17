# analysis/urls.py

from django.urls import path
from .views import DashboardView

app_name = 'analysis'

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
]
