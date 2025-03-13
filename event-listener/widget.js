var eventsLimit = 5,
    totalEvents = 0;

var includeFollowers = true,
    includeSubs = true,
    includeTips = true,
    includeCheers = true,
    includeRedemptions = true,
    includeHosts = true,
    includeRaids = true;

var minTip = 0,
    minCheer = 0,
    minHost = 0,
    minRaid = 0;

var showIcons = true;

var userLocale = '{locale}';
    userCurrency = null;

const container = document.querySelector('.main-container');

function isEmpty(variable) {
    return (variable === undefined || variable === null || (typeof variable === 'string' && variable.length <= 0));
}

function getVariables(event, text) {
    if(!event)
        return;

    text = text.toString();

    switch(event.type) {
        case 'subscriber':
        case 'sub':
            text = text.replace('{sender}',  event.sender || ''),
            text = text.replace('{amount}',  event.amount),
            text = text.replace('{tier}',  event.tier);
            break;
        case 'tip':
            text = text.replace('{amount}', event.amount.toLocaleString(userLocale, {
                style: 'currency',
                currency: userCurrency.code
            })),
            text = text.replace('{message}', event.message ? event.message.toString() : '');
            break;
        case 'cheer':
        case 'host':
        case 'raid':
            text = text.replace('{amount}', event.amount.toLocaleString()),
            text = text.replace('{message}', event.message ? event.message.toString() : '');
            break;
    }
    

    return text
}

function removeEvent(eventID) {
    const query = `[data-event-id="${eventID}"]`;
    if(!document.querySelector(query))
        return;

    document.querySelector(query).classList.add('hide');
    setTimeout(function(){
        document.querySelector(query).remove();
    }, 500)
}

function addEvent(type, username, text='') {
    if(isEmpty(type) || isEmpty(username))
        return;
        
    totalEvents +=1;

    const template = document.getElementById('event-template'),
        element = template.content.cloneNode(true);

    element.querySelector('.event').classList.add(type);
  	element.querySelector('.event').classList.add('show');
    element.querySelector('.event').setAttribute('data-event-id', totalEvents);

    if(showIcons)
        element.querySelector('.event-icon').classList.add(type);
    else
        element.querySelector('.event-icon').classList.add('hidden');

    element.querySelector('.username').innerText = `${username} ${text}`;

    container.prepend(element);

    setTimeout(function(){
        element.querySelector('.event').classList.remove('show');
    }, 500);

    if(totalEvents > eventsLimit)
        removeEvent(totalEvents - eventsLimit);
}

function readEvent(event) {
    if(!event)
        return;

    switch(event.type) {
        case 'follower':
            if(includeFollowers)
                addEvent('follower', (event.displayName || event.name));
            
            break;
        case 'subscriber':
        case 'sub':
            if(includeSubs)
                addEvent('subscriber', (event.displayName || event.name), getVariables(event, '{subText}'));
            
            break;
        case 'tip':
            if(includeTips && minTip <= event.amount)
                addEvent('tip', (event.displayName || event.name), getVariables(event, '{tipText}'));
            
                break;
        case 'cheer':
            if(includeCheers && minCheer <= event.amount)
                addEvent('cheer', (event.displayName || event.name), getVariables(event, '{cheerText}'));
            
            break;
        case 'redemption':
            if(includeRedemptions)
                addEvent('redemption', (event.displayName || event.name), getVariables(event, '{redemptionText}'));
            
            break;
        case 'host':
            if(includeHosts && minHost <= event.amount)
                addEvent('host', (event.displayName || event.name), getVariables(event, '{hostText}'));

            break;
        case 'raid':
            if(includeRaids && minRaid <= event.amount)
                addEvent('raid', (event.displayName || event.name), getVariables(event, '{raidText}'));
    }
}

window.addEventListener('onWidgetLoad', function(obj){
    const recents = obj.detail.recents;
    recents.sort(function(a, b){
        return Date.parse(a.createdAt) - Date.parse(b.createdAt);
    });

    const fieldData = obj.detail.fieldData;

    userLocale = fieldData.locale,
    userCurrency = obj.detail.currency;

    eventsLimit = fieldData.eventsLimit;

    minTip = fieldData.minTip,
    minCheer = fieldData.minCheer,
    minHost = fieldData.minHost,
    minRaid = fieldData.minRaid;

    includeFollowers = (fieldData.includeFollowers === 'yes'),
    includeSubs = (fieldData.includeSubs === 'yes'),
    includeTips = (fieldData.includeTips === 'yes'),
    includeCheers = (fieldData.includeCheers === 'yes'),
    includeRedemptions = (fieldData.includeRedemptions === 'yes'),
    includeHosts = (fieldData.includeHosts === 'yes'),
    includeRaids = (fieldData.includeRaids === 'yes');

    showIcons = (fieldData.showEventIcon === 'yes');

    for(let eventIndex=0;eventIndex<recents.length;eventIndex++){
        const event = recents[eventIndex];

        readEvent(event);
    }
}),
window.addEventListener('onEventReceived', function(obj){
    const event = obj.detail.event;

    if(!event)
        return;
    readEvent(event);
})
