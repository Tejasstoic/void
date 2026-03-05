from django.utils import timezone
from datetime import timedelta
from reputation.models import ReputationScore
from .models import Proposal, Vote, AuditLog
from content.models import Post

def calculate_vote_weight(user):
    """Determine voting power based on user reputation composite score."""
    try:
        rep = user.reputation
        # Minimal weight is 1.0, maximum is the composite score (0-100)
        return max(1.0, rep.composite_score)
    except ReputationScore.DoesNotExist:
        return 1.0

def evaluate_and_resolve_proposal(proposal_id):
    """ Check consensus and resolve proposal if threshold met. """
    try:
        proposal = Proposal.objects.get(id=proposal_id)
    except Proposal.DoesNotExist:
        return None

    if proposal.status != Proposal.ProposalStatus.PENDING:
        return proposal

    # Threshold: if any choice reaches 50% of "significant weight" or 200 absolute points
    # This is a simplified consensus model for the MVP
    weights = {
        'SAFE': proposal.safe_weight,
        'MATURE': proposal.mature_weight,
        'PROHIBITED': proposal.prohibited_weight
    }
    
    threshold = 150.0 # Arbitrary point threshold for decision
    
    winner = max(weights, key=weights.get)
    if weights[winner] >= threshold:
        # Resolve
        apply_governance_decision(proposal, winner)
    elif timezone.now() >= proposal.expires_at:
        # Resolve to winner even if below threshold if time is up, 
        # or mark as expired if no activity
        if sum(weights.values()) > 0:
            apply_governance_decision(proposal, winner)
        else:
            proposal.status = Proposal.ProposalStatus.EXPIRED
            proposal.save()
            
    return proposal

def apply_governance_decision(proposal, decision):
    """ Apply the outcome of a governance vote to a post. """
    post = proposal.target_post
    
    old_status = post.moderation_status
    post.moderation_status = decision
    post.save()
    
    proposal.status = Proposal.ProposalStatus.PASSED
    proposal.resolved_at = timezone.now()
    proposal.save()
    
    # Audit log
    AuditLog.objects.create(
        admin_user=None, # System action based on community
        target_user=post.author,
        action_type='GOVERNANCE_DECISION',
        reason=f"Community consensus moved post from {old_status} to {decision}. Proposal: {proposal.id}"
    )
