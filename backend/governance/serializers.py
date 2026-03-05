from rest_framework import serializers
from .models import AuditLog, Proposal, Vote

class AuditLogSerializer(serializers.ModelSerializer):
    admin_alias = serializers.CharField(source='admin_user.alias', read_only=True)
    target_alias = serializers.CharField(source='target_user.alias', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'admin_alias', 'target_alias', 'action_type', 'reason', 'created_at']

class ProposalSerializer(serializers.ModelSerializer):
    proposer_alias = serializers.CharField(source='proposer.alias', read_only=True)
    target_post_content = serializers.CharField(source='target_post.content', read_only=True)
    
    class Meta:
        model = Proposal
        fields = [
            'id', 'target_post', 'target_post_content', 'proposer', 'proposer_alias', 
            'reason', 'status', 'safe_weight', 'mature_weight', 'prohibited_weight', 
            'expires_at', 'created_at', 'resolved_at'
        ]
        read_only_fields = ['status', 'safe_weight', 'mature_weight', 'prohibited_weight', 'resolved_at', 'expires_at']

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['id', 'proposal', 'user', 'choice', 'weight', 'created_at']
        read_only_fields = ['user', 'weight']
