import re

from django.core.exceptions import ValidationError
from django.http import HttpRequest, HttpResponse
from django.utils.translation import ugettext as _

from zerver.decorator import require_realm_admin
from zerver.lib.actions import do_add_realm_playground
from zerver.lib.request import REQ, JsonableError, has_request_variables
from zerver.lib.response import json_error, json_success
from zerver.lib.validator import check_string, check_url
from zerver.models import UserProfile


def check_pygments_language(var_name: str, val: object) -> str:
    s = check_string(var_name, val)
    valid_pygments_language = re.compile(r'^[ a-zA-Z0-9_+-./#]*$')
    matched_results = valid_pygments_language.match(s)
    if not matched_results:
        raise JsonableError(_("Invalid characters in pygments language"))
    return s

@require_realm_admin
@has_request_variables
def add_realm_playground(request: HttpRequest, user_profile: UserProfile,
                         name: str=REQ(), url_prefix: str=REQ(validator=check_url),
                         pygments_language: str=REQ(validator=check_pygments_language)
                         ) -> HttpResponse:
    playground_dict = {
        "name": name.strip(),
        "pygments_language": pygments_language.strip(),
        "url_prefix": url_prefix.strip()
    }
    try:
        playground_id = do_add_realm_playground(
            realm=user_profile.realm,
            playground_info=playground_dict)
        return json_success({"id": playground_id})
    except ValidationError as e:  # nocoverage
        return json_error(e.messages[0], data={"errors": dict(e)})
