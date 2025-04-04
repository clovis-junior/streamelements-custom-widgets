var	ignoredUsers = [],
    displayBadges = 'yes',
	hideCommands = false;

var targetChannel;

var	messagesLimit = 0,
	messagesHide = 0;

const twitchColors = ['Blue', 'Coral', 'DodgerBlue', 'SpringGreen', 'YellowGreen', 'Green', 'OrangeRed', 'Red', 'GoldenRod', 'HotPink'];
const container = document.querySelector('.main-container');

function animateCSS(element, animation, prefix='animate__') {
	const animationName = `${prefix}${animation}`;

	var node = undefined;
	if(element instanceof HTMLElement)
		node = element;
	else if (element instanceof String)
		node = document.querySelector(element);
	
	if(!node)
		return;

	node.classList.add(`${prefix}animated`, animationName);

	node.addEventListener('animationend', function(event) {
		event.stopPropagation();
		node.classList.remove(`${prefix}animated`, animationName)
	}, {once: true})
}

function isEmpty(variable) {
    return (typeof variable === 'undefined' || variable === null || (typeof variable === 'string' && variable.length <= 0));
}

function htmlEncode(string) {
	string = string.toString();

    return string.replace(/[<>"^]/g, function(e) {
        return `&#${e.charCodeAt(0)};`
    });
}

function attachMessageEmotes(emotes=[], text='', provider='twitch') {
	text = text.replace(/([^\s]*)/gi, function(match, key) {
		const result = emotes.filter(function(emote) {
			return htmlEncode(emote.name) === key
		});

		if (!isEmpty(result[0])) {
			let url = result[0]['urls'][1];
            if (provider === 'twitch') {
                let imageElement = document.createElement('img');
				imageElement.classList.add('emote'),
				imageElement.src = result[0]['urls'][2];

				return imageElement.outerHTML
			} else {
                if (isEmpty(result[0].coords))
                    result[0].coords = {x: 0, y: 0};
                        
				let x = parseInt(result[0].coords.x),
                	y = parseInt(result[0].coords.y);

				let emoteElement = document.createElement('span');
				imageElement.classList.add('emote'),
				emoteElement.style.backgroundImage = `url(${url})`,
				emoteElement.style.backgroundPosition = `-${x}px -${y}px`;

				return emoteElement.outerHTML
			}
		} else return key;
	});

	return text
}

function formatMessageText(text) {
	text = text.toString();

	text = htmlEncode(text);

	text = text.replace(/\@([A-Za-z0-9\-\_]{4,})/g, function(match) {
		const template = document.getElementById('mention-template'),
			element = template.content.cloneNode(true);
	
		element.querySelector('.mention').innerText = match.toString();
	
		return element.firstElementChild.outerHTML
	});

	text = text.replace(/(?<protocol>https?)(?:\:)\/\/(\w+\.)?(?<domain>\w{1,256}\.[a-zA-Z0-9.]{1,})(?:[\/\?\=\&\#\.][\w-]+)*\/?/g, function(match) {
		const template = document.getElementById('link-template'),
			element = template.content.cloneNode(true);
	
		element.querySelector('.link').innerText = match.toString();
	
		return element.firstElementChild.outerHTML
	});

	return text
}

function insertMessage(data) {
	if(!data || ignoredUsers.indexOf(data.nick) > -1 || hideCommands && data.text.startsWith('!'))
		return;

	const template = document.getElementById('chat-template'),
        element = template.content.cloneNode(true);

  	animateCSS(element.querySelector('.chat'), '{chatAnimationIn}');

  	if(displayBadges === 'yes') {
      	for(let i=0;i<data.badges.length;i++) {
			let imageElement = document.createElement('img');
			imageElement.src = data.badges[i]['url'];

			element.querySelector('.chat-user-badges').appendChild(imageElement)
		}
      
		element.querySelector('.chat-user-badges').setAttribute('style', `--badges: ${data.badges.length}`)
    }
	

	element.querySelector('.chat').setAttribute('data-message-id', data.id || 0);

	element.querySelector('.chat-header').style.backgroundColor = data.displayColor;

	element.querySelector('.chat-user-name').setAttribute('data-author-id', data.userId || 0);
	element.querySelector('.chat-user-name').innerHTML = data.nick;

	let messageShow = formatMessageText(data.text);
	messageShow = attachMessageEmotes(data.emotes, messageShow);

    element.querySelector('.chat-message-content').innerHTML = messageShow;

  	container.append(element);

	if(messagesHide !== 0) {
		setTimeout(function(){
			removeMessage(element)
		}, parseInt(messagesHide * 1000));
	}
  
  	if(messagesLimit != 0 && container.children.length > messagesLimit)
		removeMessage(container.children[0]);
}

function removeMessage(element) {
  	if(isEmpty(element))
    	return;
  
	if(element instanceof HTMLElement) {
		animateCSS(element, '{chatAnimationOut}');
		
		element.addEventListener('animationend', function() {
			element.remove();
		}, {once: true})

		return
	} else {
		animateCSS(container.children[container.children.length - 1], '{chatAnimationOut}');
		
		container.children[container.children.length - 1].addEventListener('animationend', function() {
			container.children[container.children.length - 1].remove()
		}, {once: true})
	}
}

function getChannelInfos(){
  	if(isEmpty(targetChannel))
       return;
  
  	console.log(targetChannel);
  
	fetch(`https://api.streamelements.com/kappa/v2/channels/${targetChannel.id}`, {
		method: 'GET',
		headers: {
			'Accept:': 'application/json; charset=utf-8'
		}
	}).then(response => response.json()).then(function(profile) {
		fetch(`https://api.streamelements.com/kappa/v2/channels/${profile._id}/emotes`, {
			method: 'GET',
			headers: {
				'Accept:': 'application/json; charset=utf-8'
			}
		}).then(response => response.json()).then(function(emotes) {
			channels[profile.username].emotes = {
				'bttvChannelEmotes': emotes.bttvChannelEmotes,
				'bttvGlobalEmotes': emotes.bttvGlobalEmotes,
				'ffzChannelEmotes': emotes.ffzChannelEmotes,
				'ffzGlobalEmotes': emotes.ffzGlobalEmotes
			}
		})
    })
}

window.addEventListener('onWidgetLoad', function(obj){	
	const fieldData = obj.detail.fieldData;

	if(!isEmpty(fieldData.ignoredUsers)) {
		ignoredUsers = fieldData.ignoredUsers.toLowerCase(),
		ignoredUsers = ignoredUsers.replace(/\s+/g, ''),
		ignoredUsers = ignoredUsers.split(',')
	}

	hideCommands = fieldData.hideCommands || hideCommands;

  	displayBadges = fieldData.displayBadges || displayBadges;
  
	messagesLimit = fieldData.messagesLimit || messagesLimit,
	messagesHide = fieldData.hideAfter || messagesHide;
  
  	targetChannel = obj.detail.channel;

	getChannelInfos();
}),
window.addEventListener('onEventReceived', function(obj){
	if (obj.detail.event.listener === 'widget-button') {
		if (obj.detail.event.value === 'send-test') {
			const event = {
                'detail': {
                  	'listener': 'message',
                    'event': {
                        'data': {
                            'nick': 'jimmy',
                            'displayColor': twitchColors[Math.floor((Math.random() * twitchColors.length))],
                            'badges': [{
                                'type': 'moderator',
                                'version': '3',
                                'url': 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3'
                            },{
                                'type': 'partner',
                                'version': '3',
                                'url': 'https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/3'
                            }],
                            'text': 'Hey @' + targetChannel.username + ' This is the test message! Kappa\nCheck out more widgets in https://github.com/clovis-junior/streamelements-custom-widgets/',
                            'emotes': [{
                                'type': 'twitch',
                                'name': 'Kappa',
                                'id': '25',
                                'gif': false,
                                'animated': false,
                                'urls': {
                                    '1': 'https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/1.0',
                                    '2': 'https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/2.0',
                                    '4': 'https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/3.0'
                                },
                                'start': 26,
                                'end': 31
                            }]
                        }
                    }
                }
            };
	
			window.dispatchEvent(new CustomEvent('onEventReceived', event));
			return
		} else if (obj.detail.event.value === 'delete-test')
			return removeMessage(container.children[0]);
	}

	if (obj.detail.listener === 'message')
		insertMessage(obj.detail.event.data);
})
