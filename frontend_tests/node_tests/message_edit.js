set_global('document', null);
set_global('page_params', {});

global.stub_out_jquery();

set_global('XDate', zrequire('XDate', 'xdate/src/xdate'));
zrequire('message_edit');

const get_editability = message_edit.get_editability;
const editability_types = message_edit.editability_types;

run_test('get_editability', () => {
    // You can't edit a null message
    assert.equal(get_editability(null), editability_types.NO);
    // You can't edit a message you didn't send
    assert.equal(get_editability({
        sent_by_me: false,
    }), editability_types.NO);

    // Failed request are currently not editable (though we want to
    // change this back).
    assert.equal(get_editability({
        sent_by_me: true,
        failed_request: true,
    }), editability_types.NO);

    // Locally echoed messages are not editable, since the message hasn't
    // finished being sent yet.
    assert.equal(get_editability({
        sent_by_me: true,
        local_id: "25",
    }), editability_types.NO);

    // For the rest of these tests, we only consider messages sent by the
    // user, and that were successfully sent (i.e. no failed_request or local_id)
    let message = {
        sent_by_me: true,
    };

    global.page_params = {
        realm_allow_message_editing: false,
    };
    assert.equal(get_editability(message), editability_types.NO);

    global.page_params = {
        realm_allow_message_editing: true,
        // Limit of 0 means no time limit on editing messages
        realm_message_content_edit_limit_seconds: 0,
    };
    assert.equal(get_editability(message), editability_types.FULL);

    global.page_params = {
        realm_allow_message_editing: true,
        realm_message_content_edit_limit_seconds: 10,
    };
    const now = new Date();
    const current_timestamp = now / 1000;
    message.timestamp = current_timestamp - 60;
    // Have 55+10 > 60 seconds from message.timestamp to edit the message; we're good!
    assert.equal(get_editability(message, 55), editability_types.FULL);
    // It's been 60 > 45+10 since message.timestamp. When realm_allow_message_editing
    // is true, we can edit the topic if there is one.
    message.type = 'stream';
    assert.equal(get_editability(message, 45), editability_types.TOPIC_ONLY);
    message.type = 'private';
    assert.equal(get_editability(message, 45), editability_types.NO_LONGER);
    // If we don't pass a second argument, treat it as 0
    assert.equal(get_editability(message), editability_types.NO_LONGER);

    message = {
        sent_by_me: false,
        type: 'stream',
    };
    global.page_params = {
        realm_allow_community_topic_editing: true,
        realm_allow_message_editing: true,
        realm_message_content_edit_limit_seconds: 0,
        realm_message_topic_edit_limit_seconds: 86400,
        is_admin: false,
    };
    // You can still edit the topic of a message, you didn't send (within the time limit).
    message.timestamp = current_timestamp - 60;
    assert.equal(get_editability(message), editability_types.TOPIC_ONLY);

    // Test `message_edit.is_topic_editable()`
    assert.equal(message_edit.is_topic_editable(message), true);

    message.sent_by_me = true;
    global.page_params.realm_allow_community_topic_editing = false;
    // You can edit the topic of message you sent, anytime.
    assert.equal(message_edit.is_topic_editable(message), true);

    message.sent_by_me = false;
    global.page_params.realm_allow_community_topic_editing = false;
    // Realm settings prevents community users from editing topic.
    assert.equal(message_edit.is_topic_editable(message), false);

    message.sent_by_me = false;
    global.page_params.realm_allow_community_topic_editing = false;
    global.page_params.is_admin = true;
    // Organization admins can edit message topics indefinitely.
    assert.equal(message_edit.is_topic_editable(message), true);

    global.page_params.realm_allow_message_editing = false;
    // Realm message editing setting prevents editing topics as well.
    assert.equal(message_edit.is_topic_editable(message), false);

    message.timestamp = current_timestamp - 85350
    // 86350 + 60 > 86400, so the topic can't be edited.
    assert.equal(message_edit.is_topic_editable(message, 60), false)

    // 85350 < 86400 so message is still editable.
    assert.equal(message_edit.is_topic_editable(message), true)

});

run_test('get_deletability', () => {
    global.page_params = {
        is_admin: true,
        realm_allow_message_deleting: false,
        realm_message_content_delete_limit_seconds: 0,
    };
    const message = {
        sent_by_me: false,
        locally_echoed: true,
    };

    // Admin can always delete any message
    assert.equal(message_edit.get_deletability(message), true);

    // Non-admin can't delete message sent by others
    global.page_params.is_admin = false;
    assert.equal(message_edit.get_deletability(message), false);

    // Locally echoed messages are not deletable
    message.sent_by_me = true;
    assert.equal(message_edit.get_deletability(message), false);

    message.locally_echoed = false;
    assert.equal(message_edit.get_deletability(message), false);

    global.page_params.realm_allow_message_deleting = true;
    assert.equal(message_edit.get_deletability(message), true);

    const now = new Date();
    const current_timestamp = now / 1000;
    message.timestamp = current_timestamp - 5;

    global.page_params.realm_message_content_delete_limit_seconds = 10;
    assert.equal(message_edit.get_deletability(message), true);

    message.timestamp = current_timestamp - 60;
    assert.equal(message_edit.get_deletability(message), false);
});
