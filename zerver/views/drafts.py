import datetime
from django.http import HttpResponse, HttpRequest

from typing import List, Optional
from zerver.models import UserProfile, Message, Draft

from zerver.lib.request import has_request_variables, REQ
from zerver.lib.response import json_success, json_error
from zerver.lib.actions import do_add_message_draft
from zerver.lib.streams import (
    access_stream_by_name,
    check_stream_name
)
from zerver.lib.addressee import Addressee
from zerver.lib.exceptions import JsonableError
from zerver.lib.timestamp import timestamp_to_datetime, datetime_to_timestamp

@has_request_variables
def add_message_draft(
    request: HttpRequest, user_profile: UserProfile,
    message_type: str=REQ(),
    message_content: str=REQ(),
    last_edit_time: datetime.datetime=REQ(converter=int),
    private_message_recipient:str=REQ(default=None),
    stream_name: Optional[str]=REQ('stream', default=None),
    topic_name: Optional[str]=REQ('topic', default=None)) -> HttpResponse:
    # We aren't sure whether the stream name or sender details exist.


    if message_type == "stream":
        # addressee = Addressee.for_stream_name(stream_name, topic_name)
        check_stream_name(stream_name)
        try:
            (stream, recipient, sub) = access_stream_by_name(user_profile, stream_name)
        except JsonableError as e:
            return json_error(e.msg, status=404)
    else:
        pass

    draft = Draft()
    draft.sender = user_profile
    draft.content = message_content
    draft.recipient = recipient

    # TODO: Is this conversion enough? should we convert it earlier?
    draft.last_edit_time = timestamp_to_datetime(last_edit_time/1000)
    draft.topic = topic_name

    do_add_message_draft(draft)

    return json_success({'draft_messages': True})