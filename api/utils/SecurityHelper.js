export let getAuthenticatedTwitchUserName = (request) => {
    if (request.extension && request.extension.user_id) {
        return request.extension.user_id;
    }
    
    return null;
}