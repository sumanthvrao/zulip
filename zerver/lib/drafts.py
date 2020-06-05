import datetime
from django.db import transaction
from zerver.models import (
    Draft,
    Recipient,
    Message,
    UserProfile,
)

@transaction.atomic
def add_user_draft_messages(draft: Draft) -> None:
    sender = draft.sender
    recipient = draft.recipient
    topic = draft.topic
    content = draft.content
    last_edit_time = draft.last_edit_time

    Draft.objects.create(sender=sender, recipient=recipient, topic=topic, content=content,
    last_edit_time=last_edit_time)

    # Draft.objects.bulk_create(
    #     Draft(sender=sender, recipient=recipient, topic=topic, content=content)
    # )

    # Flush cache here

    # Implement this later
    # return user_draft_messages(user_profile)

    return