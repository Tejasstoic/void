import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from content.models import Post
from governance.models import Proposal, Vote
from governance.logic import evaluate_and_resolve_proposal

print("--- Governance Logic Verification ---")
User = get_user_model()

# 1. Setup
u1 = User.objects.filter(email='test1@example.com').first()
if not u1:
    u1 = User.objects.create_user(email='test1@example.com', password='pw', alias='ShadowSage', date_of_birth='1990-01-01')

# Ensure high reputation for weight
from reputation.models import ReputationScore
rep, _ = ReputationScore.objects.get_or_create(user=u1)
rep.composite_score = 95.5
rep.save()

p1 = Post.objects.create(author=u1, content="Spammy post for moderation", moderation_status='PENDING')

# 2. Create Proposal
prop = Proposal.objects.create(
    target_post=p1,
    proposer=u1,
    reason="Clearly spam",
    expires_at=timezone.now() + timedelta(hours=24)
)
print(f"Created proposal: {prop.id} for post {p1.id}")

# 3. Cast Vote
v1 = Vote.objects.create(
    proposal=prop,
    user=u1,
    choice='PROHIBITED',
    weight=95.5
)
prop.prohibited_weight = 95.5
prop.save()
print(f"ShadowSage voted PROHIBITED (weight 95.5)")

# 4. Cast another vote to cross threshold (150)
u2 = User.objects.filter(email='test2@example.com').first()
if not u2:
    u2 = User.objects.create_user(email='test2@example.com', password='pw', alias='Debater', date_of_birth='1992-01-01')

rep2, _ = ReputationScore.objects.get_or_create(user=u2)
rep2.composite_score = 60.0
rep2.save()

v2 = Vote.objects.create(
    proposal=prop,
    user=u2,
    choice='PROHIBITED',
    weight=60.0
)
prop.prohibited_weight += 60.0 # Total 155.5
prop.save()
print(f"Debater voted PROHIBITED (weight 60.0). Total weight: {prop.prohibited_weight}")

# 5. Evaluate
evaluate_and_resolve_proposal(prop.id)
prop.refresh_from_db()
p1.refresh_from_db()

print(f"Proposal Status: {prop.status}")
print(f"Post Moderation Status: {p1.moderation_status}")

if p1.moderation_status == 'PROHIBITED' and prop.status == 'PASSED':
    print("SUCCESS: Governance consensus applied correctly.")
else:
    print("FAILURE: Governance consensus mismatch.")
