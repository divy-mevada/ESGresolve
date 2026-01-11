from django.contrib import admin
from .models import (
    BusinessProfile, ESGInput, ESGSnapshot, ESGScore,
    ESGRecommendation, ESGRoadmap, ChatSession, ChatMessage
)

admin.site.register(BusinessProfile)
admin.site.register(ESGInput)
admin.site.register(ESGSnapshot)
admin.site.register(ESGScore)
admin.site.register(ESGRecommendation)
admin.site.register(ESGRoadmap)
admin.site.register(ChatSession)
admin.site.register(ChatMessage)

