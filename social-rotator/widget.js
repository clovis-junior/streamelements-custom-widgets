const socialMax = 5;

var socialArray = [],
	slideIndex = 0,
	slideTimer = 0,
	slideInterval = 0;

function getSocials(data) {
	for(let i=1;i<=socialMax;i++){
		if(data[`social${i}Display`] !== 'false') {
    		socialArray.push({
      			username: data[`social${i}Name`],
        		icon: data[`social${i}Icon`],
        		color: data[`social${i}Color`]
      		})
    	}	
   }
}

function showSocial() {
  	let socials = document.getElementsByClassName('social');
    for(let i=0;i<socials.length;i++){
      	socials[i].children[1].style.width = 0;
      	if(socials[i].classList.contains('show'))
    		socials[i].classList.remove('show');
	}
  
    slideIndex++;
  	if (slideIndex > socials.length) {
      slideIndex = 0;
      return setTimeout(showSocial, (slideInterval * 60000));
    }
  
    socials[slideIndex - 1].classList.add('show');
  	window.setTimeout(function(){
    	socials[slideIndex - 1].children[1].style.width = `${socials[slideIndex - 1].children[1].scrollWidth}px`;
    }, 300);
  	return setTimeout(showSocial, (slideTimer * 1000));
}

function mountSocials(){
    for(var social of socialArray){
		const template = document.getElementById('social-template'),
			element = template.content.cloneNode(true);

		element.querySelector('.social-icon').style.color = `${social.color}`;
    	element.querySelector('.social-icon').classList.add(`fa-${social.icon}`);
    	element.querySelector('.social-name').innerText = `${social.username}`;

		document.querySelector('.main-container').append(element)
  	}
}

window.addEventListener('onWidgetLoad', function(obj){
	const fieldData = obj.detail.fieldData;

  	slideTimer = fieldData['slideTimer'];
    slideInterval = fieldData['slideInterval'];

	getSocials(fieldData);
	mountSocials();
    window.setTimeout(showSocial, (slideInterval * 60000));
})
