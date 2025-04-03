'use strict';

const container = document.querySelector('.container');

var player = null;
var youtubeIp = 'http://127.0.0.1:9863';

var counting = null,
	waiting = 0;

var titleScroll = null,
	titleScrolled = false,
	artistScroll = null,
	artistScrolled = false;

function addZero(number) {
	number = number.toString();

	return number.length < 2 ? `0${number.toString()}` : number;
}

function convertTime(time) {
	time = time || 0;

	let minutes = Math.floor(time / 60),
		seconds = time % 60;

	return `${addZero(minutes)}:${addZero(seconds)}`;
}

function startCounter() {
	if (counting === null) {
		counting = setInterval(() => {
			waiting++;
		}, 1000);
	}

	return false;
}
function stopCounter() {
	waiting = 0;
	clearInterval(counting);
	counting = null;

	return false;
}

async function reloadPlayer(player) {
	if (!player) return;

	try {
		const response = await fetch(`${youtubeIp}/query`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.status !== 200) {
			setTimeout(function () {
				reloadPlayer(player);
			}, 3000);
		}

		const data = await response.json();

		const title = document.getElementById('music-title'),
			artist = document.getElementById('music-author'),
			albumArt = document.getElementById('music-album-art'),
			albumArtBg = document.querySelector('.music-album-blur-container .music-album-art');

		const progress = document.getElementById('music-progress-bar'),
			timeElapsedElement = document.getElementById('music-time-elapsed'),
			timeTotalElement = document.getElementById('music-time-total');

		const isPaused = data.player?.isPaused,
			hasSong = data.player?.hasSong;

		if (isPaused) {
			startCounter();

			player.classList.add('paused');

			if (waiting >= 60 && player.classList.contains('show'))
				player.classList.remove('show');
		} else {
			player.classList.remove('paused');

			if (!player.classList.contains('show')) player.classList.add('show');
		}

		if (hasSong && !isPaused) {
			stopCounter();

			if (!player.classList.contains('show')) player.classList.add('show');
		} else if (!hasSong) {
			startCounter();

			if (waiting >= 10 && player.classList.contains('show'))
				player.classList.remove('show');
		}

		if (progress && !isPaused) {
			requestAnimationFrame(() => {
				let percentage = Math.floor(
					(data.player?.seekbarCurrentPosition * 100) / data.track?.duration
				);

				progress.style.width = `${percentage}%`;
			});
		}

		if(timeElapsedElement)
			timeElapsedElement.innerText = convertTime(data.player?.seekbarCurrentPosition);
		
		if(timeTotalElement)
			timeTotalElement.innerText = convertTime(data.track?.duration);

		if (title.innerText !== data.track?.title)
			title.innerText = data.track?.title;

		if (titleScroll === null) {
			titleScroll = setInterval(() => {
				title.style.transform = !titleScrolled
					? `translateX(-${title.scrollWidth - title.offsetWidth}px)`
					: `translateX(0)`;

				titleScrolled = !titleScrolled;
			}, 5000);
		}

		if (artist.innerText !== data.track?.author)
			artist.innerText = data.track?.author;

		if (artistScroll === null) {
			artistScroll = setInterval(() => {
				artist.style.transform = !artistScrolled
					? `translateX(-${artist.scrollWidth - artist.offsetWidth}px)`
					: `translateX(0)`;

				artistScrolled = !artistScrolled;
			}, 10000);
		}

		if (albumArt && albumArt.src !== data.track?.cover)
			albumArt.src = data.track?.cover;

		if (albumArtBg && albumArtBg.style.backgroundImage !== `url(${data.track?.cover})`)
			albumArtBg.style.backgroundImage = `url(${data.track?.cover})`;

	} catch (e) {
		console.error(e.message.toString());

		if (player.classList.contains('show')) player.classList.remove('show');
	}
}

function mountPlayer(compact = false, data = {}, then) {
	const template = document.getElementById(compact ? 'player-compact-template' : 'player-default-template'),
        element = template.content.cloneNode(true);

	if(data?.hideShadow)
		element.querySelector('[class^="music-player"]').classList.add('no-shadow');

	if(!data?.hideWaves)
		insertWaves(data?.waveSize, element.querySelector('.music-waveforms'));
	else
		element.querySelector('.music-waveforms').remove();

	if(data?.hideProgress) {
		element.querySelector('.music-progress').remove();

		if(!data?.hideWaves && !compact) {
			let waves = document.createElement('div');
			waves.classList.add('music-waveforms');

			insertWaves(data?.waveSize, waves);

			element.querySelector('.music-infos').appendChild(waves);
		}
	}

	if(!compact && data?.hideAlbumArt)
		element.querySelector('.music-album-art').remove();

	if(!data?.albumArtBlur)
		element.querySelector('.music-album-blur-container').remove();

	container.prepend(element);

	if(typeof then === 'function')
		return then();

	return
}

function insertWaves(number = 8, element = null) {
	number = parseInt(number) || 0;

	if(!(element instanceof HTMLElement))
		return;

	for(let i=0;i<number;i++) {
		let wave = document.createElement('span');
		wave.classList.add('waveform');

		element.append(wave)
	}

	return
}

window.addEventListener('onWidgetLoad', function(obj) {
	const fieldData = obj.detail?.fieldData;

	youtubeIp = fieldData?.youTubeMusicDesktop || youtubeIp;

	return mountPlayer(fieldData?.compactPlayer, fieldData, function(){
		player = document.querySelector('[class^="music-player"]');
		
		setInterval(async function() {
			await reloadPlayer(player)
		}, 500)
	})
})
