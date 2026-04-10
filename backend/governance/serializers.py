from rest_framework import serializers
from .models import AuditLog, Proposal, Vote, Strike

class AuditLogSerializer(serializers.ModelSerializer):
    admin_alias = serializers.CharField(source='admin_user.alias', read_only=True, default='System')
    target_alias = serializers.CharField(source='target_user.alias', read_only=True, default='Unknown')

    class Meta:
        model = AuditLog
        fields = ['id', 'admin_alias', 'target_alias', 'action_type', 'reason', 'created_at']

class ProposalSerializer(serializers.ModelSerializer):
    proposer_alias = serializers.CharField(source='proposer.alias', read_only=True)
    target_post_content = serializers.CharField(source='target_post.content', read_only=True)
    vote_count = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = [
            'id', 'target_post', 'target_post_content', 'proposer', 'proposer_alias',
            'reason', 'status', 'safe_weight', 'mature_weight', 'prohibited_weight',
            'expires_at', 'created_at', 'resolved_at', 'vote_count'
        ]
        read_only_fields = ['status', 'safe_weight', 'mature_weight', 'prohibited_weight', 'resolved_at', 'expires_at']

    def get_vote_count(self, obj):
        return obj.votes.count()

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['id', 'proposal', 'user', 'choice', 'weight', 'created_at']
        read_only_fields = ['user', 'weight']

class StrikeSerializer(serializers.ModelSerializer):
    user_alias = serializers.CharField(source='user.alias', read_only=True, default='Unknown')
    issued_by_alias = serializers.CharField(source='issued_by.alias', read_only=True, default='System')

    class Meta:
        model = Strike
        fields = ['id', 'user_alias', 'issued_by_alias', 'reason', 'post', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
