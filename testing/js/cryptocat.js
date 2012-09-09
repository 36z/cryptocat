var Cryptocat = function() {};
(function(){

/* Configuration */
var domain = 'crypto.cat'; // Domain name to connect to for XMPP.
var conferenceServer = 'conference.crypto.cat'; // Address of the XMPP MUC server.
var bosh = 'https://crypto.cat/http-bind'; // BOSH is served over an HTTPS proxy for better security and availability.
var fileSize = 700; // Maximum encrypted file sharing size, in kilobytes. Doesn't work above 700kb.
var groupChat = 1; // Enable/disable group chat client functionality.

/* Initialization */
var otrKeys = {};
var conversations = [];
var conversationInfo = [];
var loginCredentials = [];
var currentConversation = 0;
var audioNotifications = 0;
var desktopNotifications = 0;
var loginError = 0;
var windowFocus = 1;
var currentStatus = 'online';
var soundEmbed = null;
var conn, chatName, myNickname, myKey;
$('.input[title]').qtip();
$('.button[title]').qtip();
if (!groupChat) {
	$('#buddy-main-Conversation').remove();
}

// Detect window focus
window.onfocus = function() {
	windowFocus = 1;
	document.title = 'Cryptocat';
};
window.onblur = function() {
	windowFocus = 0;
};

// Initialize worker
var worker = new Worker('js/worker.js');
worker.addEventListener('message', function(e) {
	myKey = e.data;
	DSA.inherit(myKey);
	console.log(myKey);
	$('#dialogBoxClose').click();
}, false);

// Outputs the current hh:mm.
// If `seconds = 1`, outputs hh:mm:ss.
function currentTime(seconds) {
	var date = new Date();
	var time = [];
	time.push(date.getHours().toString());
	time.push(date.getMinutes().toString());
	if (seconds) {
		time.push(date.getSeconds().toString());
	}
	for (var just in time) {
		if (time[just].length === 1) {
			time[just] = '0' + time[just];
		}
	}
	return time.join(':');
}

// Plays the audio file defined by the `audio` variable.
function playSound(audio) {
	function createSound(audio) {
		soundEmbed = document.createElement('audio');
		soundEmbed.setAttribute('type', 'audio/webm');
		soundEmbed.setAttribute('src', audio);
		soundEmbed.setAttribute('style', 'display: none;');
		soundEmbed.setAttribute('autoplay', true);
	}
	if (!soundEmbed) {
		createSound(audio);
	}
	else {
		document.body.removeChild(soundEmbed);
		soundEmbed.removed = true;
		soundEmbed = null;
		createSound(audio);
	}
	soundEmbed.removed = false;
	document.body.appendChild(soundEmbed);
}

// Scrolls down the chat window to the bottom in a smooth animation.
// 'speed' is animation speed in milliseconds.
function scrollDown(speed) {
	$('#conversationWindow').animate({
		scrollTop: $('#conversationWindow')[0].scrollHeight + 20
	}, speed);
}

// Initiates a conversation. Internal use.
function initiateConversation(conversation) {
	if (!conversations[conversation]) {
		conversations[conversation] = '';
	}
}

// OTR functions
// Handle incoming messages
var uicb = function(buddy) {
  return function(message) {
	addtoConversation(message, buddy, buddy);
  }
}
// Handle outgoing messages
var iocb = function(buddy) {
  return function(message) {
    conn.muc.message(chatName + '@' + conferenceServer, buddy, message, null);
  }
}

// Creates a template for the conversation info bar at the top of each conversation.
function buildConversationInfo(conversation) {
	$('#conversationInfo').html(
		'<span class="chatName">' + chatName + '</span>'
	);
	//if (conversation !== 'main-Conversation') {
	//	$('#conversationInfo').append(
	//		'<span class="fingerprint">' + myKey.constructor.fingerprint(otrKeys[conversation]) + '</span>'
	//	);
	//}
	conversationInfo[currentConversation] = $('#conversationInfo').html();
}

// Switches the currently active conversation to `buddy`
function conversationSwitch(buddy) {
	if ($('#buddy-' + buddy).attr('status') !== 'offline') {
		$('#' + buddy).animate({'background-color': '#97CEEC'});
		$('#buddy-' + buddy).css('border-bottom', '1px dashed #76BDE5');
	}
	if (buddy !== 'main-Conversation') {
		$('#buddy-' + buddy).css('background-image', 'none');
	}
	$('#conversationInfo').animate({'width': '750px'}, function() {
		$('#conversationWindow').slideDown('fast', function() {
			if (conversationInfo[currentConversation]) {
				$('#conversationInfo').html(conversationInfo[currentConversation]);
			}
			else {
				buildConversationInfo(currentConversation);
			}
			$('#userInput').fadeIn('fast', function() {
				$('#userInputText').focus();
			});
			var scrollWidth = document.getElementById('conversationWindow').scrollWidth;
			$('#conversationWindow').css('width', (712 + scrollWidth) + 'px');
			scrollDown(600);
		});
	});
	// Clean up finished conversations
	$('#buddyList div').each(function() {
		if (($(this).attr('title') !== currentConversation)
			&& ($(this).css('background-image') === 'none')
			&& ($(this).attr('status') === 'offline')) {
			removeBuddy($(this).attr('title'));
		}
	});
}

// Handles login failures
function loginFail(message) {
	$('#loginInfo').html(message);
	$('#bubble').animate({'left': '+=5px'}, 130)
		.animate({'left': '-=10px'}, 130)
		.animate({'left': '+=5px'}, 130);
	$('#loginInfo').animate({'color': '#E93028'}, 'fast');
}

// Seeds the RNG via Math.seedrandom().
// If the browser supports window.crypto.getRandomValues(), then that is used.
// Otherwise, the built-in Fortuna RNG is used.
function seedRNG() {
	if ((window.crypto !== undefined) && (typeof window.crypto.getRandomValues === 'function')) {
		var buffer = new Uint8Array(1024);
		window.crypto.getRandomValues(buffer);
		var seed = '';
		for (var i in buffer) {
			seed += String.fromCharCode(buffer[i]);
			CryptoJS.Fortuna.AddRandomEvent(String.fromCharCode(buffer[i]));
		}
		Math.seedrandom(seed);
		delete seed;
		return true;
	}
	else {
		var e, up, down;
		var progressForm = '<br /><p id="progressForm"><img src="img/keygen.gif" alt="" />'
			+ 'Please type on your keyboard'
			+ ' as randomly as possible for a few seconds.</p>'
			+ '<input type="password" id="seedRNGInput" />';
		dialogBox(progressForm, 0, function() {
			$('#loginForm').submit();
		});
		$('#seedRNGInput').select();
		$('#seedRNGInput').keydown(function(event) {
			if (CryptoJS.Fortuna.Ready() === 0) {
				e = String.fromCharCode(event.keyCode);
				var d = new Date();
				down = d.getTime();
			}
		});
		$('#seedRNGInput').keyup(function() {
			if (CryptoJS.Fortuna.Ready() === 0) {
				var d = new Date();
				up = d.getTime();
				if (e) {
					CryptoJS.Fortuna.AddRandomEvent(e + (up - down));
				}
			}
			else {
				$('#seedRNGInput').unbind('keyup').unbind('keydown');
				$('#chatName').attr('readonly', 'true');
				$('#seedRNGInput').attr('readonly', 'true');
				$('#dialogBoxClose').click();
				Math.seedrandom(CryptoJS.Fortuna.RandomData(1024));				
			}
		});
		return false;
	}
}

// Generates a random string of length `size` characters.
// If `alpha = 1`, random string will contain alpha characters, and so on.
function randomString(size, alpha, uppercase, numeric) {
	var keyspace = '';
	var result = '';
	if (alpha) {
		keyspace += 'abcdefghijklmnopqrstuvwxyz';
	}
	if (uppercase) {
		keyspace += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	}
	if (numeric) {
		keyspace += '0123456789';
	}
	for (var i = 0; i !== size; i++) {
		result += keyspace[Math.floor(Math.random()*keyspace.length)];
	}
	return result;
}

// Simply shortens a string `string` to length `length.
// Adds '..' to delineate that string was shortened.
function shortenString(string, length) {
	if (string.length > length) {
		return string.substring(0, (length - 2)) + '..';
	}
	return string;
}

// Builds a buddy element to be added to the buddy list.
function buildBuddy(buddyObject) {
	if (buddyObject.nick.match(/^(\w|\s)+$/)) {
		var nick = shortenString(buddyObject.nick, 19);
	}
	else {
		var nick = shortenString(buddyObject.alias, 19);
	}
	$('<div class="buddy" title="' + buddyObject.nick + '" id="buddy-' 
		+ buddyObject.nick + '" status="online">'
		+ '<span>' + nick + '</span>' + '<div class="buddyMenu" id="menu-' + buddyObject.nick
		+ '"></div></div>').insertAfter('#buddiesOnline').slideDown('fast');
	$('#menu-' + buddyObject.nick).unbind('click');
	bindBuddyMenu(buddyObject.nick);
	$('#buddy-' + buddyObject.nick).unbind('click');
	if (nick !== myNickname) {
		bindBuddyClick(buddyObject.nick);
	}
	else {
		$('#buddy-' + buddyObject.nick).click(function() {
			$('#menu-' + buddyObject.nick).click();
		});
	}
}

// Remove buddy from buddy list
function removeBuddy(nickname) {
	$('#buddy-' + nickname).slideUp(500, function() {
		$(this).remove();
	});
}

// Convert message URLs to links. Used internally.
function addLinks(message) {
	if ((URLs = message.match(/((mailto\:|(news|(ht|f)tp(s?))\:\/\/){1}\S+)/gi))) {
		for (var i in URLs) {
			var sanitize = URLs[i].split('');
			for (var l in sanitize) {
				if (!sanitize[l].match(/\w|\d|\:|\/|\?|\=|\#|\+|\,|\.|\&|\;|\%/)) {
					sanitize[l] = encodeURIComponent(sanitize[l]);
				}
			}
			sanitize = sanitize.join('');
			message = message.replace(
				sanitize, '<a target="_blank" href="' + sanitize + '">' + URLs[i] + '</a>'
			);
		}
	}
	return message;
}

// Add emoticons to a message line. Used internally.
function addEmoticons(message) {
	return message
		.replace(/(\s|^)(:|(&#61;))-?3(?=(\s|$))/gi, ' <div class="emoticon" id="eCat">$&</div> ')
		.replace(/(\s|^)(:|(&#61;))-?'\((?=(\s|$))/gi, ' <div class="emoticon" id="eCry">$&</div> ')
		.replace(/(\s|^)(:|(&#61;))-?o(?=(\s|$))/gi, ' <div class="emoticon" id="eGasp">$&</div> ')
		.replace(/(\s|^)(:|(&#61;))-?D(?=(\s|$))/gi, ' <div class="emoticon" id="eGrin">$&</div> ')
		.replace(/(\s|^)(:|(&#61;))-?\((?=(\s|$))/gi, ' <div class="emoticon" id="eSad">$&</div> ')
		.replace(/(\s|^)(:|(&#61;))-?\)(?=(\s|$))/gi, ' <div class="emoticon" id="eSmile">$&</div> ')
		.replace(/(\s|^)-_-(?=(\s|$))/gi, ' <div class="emoticon" id="eSquint">$&</div> ')
		.replace(/(\s|^)(:|(&#61;))-?p(?=(\s|$))/gi, ' <div class="emoticon" id="eTongue">$&</div> ')
		.replace(/(\s|^)(:|(&#61;))-?(\/|s)(?=(\s|$))/gi, ' <div class="emoticon" id="eUnsure">$&</div> ')
		.replace(/(\s|^);-?\)(?=(\s|$))/gi, ' <div class="emoticon" id="eWink">$&</div> ')
		.replace(/(\s|^);-?\p(?=(\s|$))/gi, ' <div class="emoticon" id="eWinkTongue">$&</div> ')
		.replace(/(\s|^)\^(_|\.)?\^(?=(\s|$))/gi, ' <div class="emoticon" id="eYay">$&</div> ')
		.replace(/(\s|^)(:|(&#61;))-?x\b(?=(\s|$))/gi, ' <div class="emoticon" id="eShut">$&</div> ')
		.replace(/(\s|^)\&lt\;3\b(?=(\s|$))/g, ' <span class="monospace">&#9829;</span> ');
}

// Add a `message` from `sender` to the `conversation` display and log.
// Used internally.
function addtoConversation(message, sender, conversation) {
	initiateConversation(conversation);
	if (sender === myNickname) {
		lineDecoration = 1;
		audioNotification = 'snd/msgSend.webm';
	}
	else {
		lineDecoration = 2;
		audioNotification = 'snd/msgGet.webm';
		if (desktopNotifications) {
			if ((sender !== currentConversation) || (!windowFocus)) {
				Notification.createNotification('img/keygen.gif', sender, message);
			}
		}
	}
	message = message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/=/g, '&#61;');
	message = addLinks(message);
	message = addEmoticons(message);
	message = message.replace(/:/g, '&#58;');
	var timeStamp = '<span class="timeStamp">' + currentTime(0) + '</span>';
	var sender = '<span class="sender">' + shortenString(sender, 16) + '</span>';
	message = '<div class="Line' + lineDecoration + '">' + timeStamp + sender + message + '</div>';
	conversations[conversation] += message;
	if (conversation === currentConversation) {
		$('#conversationWindow').append(message);
	}
	if (audioNotifications) {
		playSound(audioNotification);
	}
	if (($('#conversationWindow')[0].scrollHeight - $('#conversationWindow').scrollTop()) < 800) {	
		scrollDown(600);
	}
}

// Handle incoming messages from the XMPP server.
function handleMessage(message) {
	var from = $(message).attr('from');
	var nick = from.match(/\/\w+/)[0].substring(1);
	var type = $(message).attr('type');
	var body = $(message).find('body').text();
	if (nick === myNickname) {
		return true;
	}
	if (type === 'groupchat' && groupChat) {
		addtoConversation(body, nick, 'main-Conversation');
		if (currentConversation !== 'main-Conversation') {
			var backgroundColor = $('#buddy-main-Conversation').css('background-color');
			$('#buddy-main-Conversation').css('background-image', 'url("img/newMessage.png")');
			$('#buddy-main-Conversation')
				.animate({'backgroundColor': '#A7D8F7'})
				.animate({'backgroundColor': backgroundColor});
		}
	}
	else if (type === 'chat') {
		otrKeys[nick].receiveMsg(body);
		if (currentConversation !== nick) {
			var backgroundColor = $('#buddy-' + nick).css('background-color');
			$('#buddy-' + nick).css('background-image', 'url("img/newMessage.png")');
			$('#buddy-' + nick)
				.animate({'backgroundColor': '#A7D8F7'})
				.animate({'backgroundColor': backgroundColor});
		}
	}
	return true;
}

// Handle incoming presence updates from the XMPP server.
function handlePresence(presence) {
	var nickname = $(presence).attr('from').match(/\/\w+/)[0].substring(1);
	// Handle errors
	if ($(presence).attr('type') === 'error') {
		if ($(presence).find('error').attr('code') === '409') {
			loginError = 1;
			logout();
			loginFail('Conflict error. Nickname may be in use.');
			return false;
		}
		return true;
	}
	// Ignore if presence status is coming from myself
	if (nickname === myNickname) {
		// Currently not ignored
		//return true;
	}
	// Add to otrKeys if necessary
	if (nickname !== 'main-Conversation' && otrKeys[nickname] === undefined) {
		otrKeys[nickname] = new OTR(myKey, uicb(nickname), iocb(nickname));
		otrKeys[nickname].REQUIRE_ENCRYPTION = true;
	}
	// Handle buddy going offline
	if ($(presence).attr('type') === 'unavailable') {
		// Delete their OTR key
		delete otrKeys[nickname];
		if ($('#buddy-' + nickname).length !== 0) {
			if ($('#buddy-' + nickname).attr('status') !== 'offline') {
				if ((currentConversation !== nickname)
					&& ($('#buddy-' + nickname).css('background-image') === 'none')) {
					removeBuddy(nickname);
				}
				else {
					$('#buddy-' + nickname).attr('status', 'offline');
					$('#buddy-' + nickname).animate({
						'color': '#BBB',
						'backgroundColor': '#222',
						'borderLeftColor': '#111',
						'borderBottom': 'none'
					});
					if (audioNotifications) {
						playSound('snd/userOffline.webm');
					}
					if (currentConversation !== nickname) {
						$('#buddy-' + nickname).slideUp('fast', function() {
							$(this).insertAfter('#buddiesOffline').slideDown('fast');
						});
					}
				}
			}
		}
	}
	// Create buddy element if buddy is new
	else if ($('#buddy-' + nickname).length === 0) {
		buildBuddy({nick: nickname, alias: ''});
		if (audioNotifications) {
			playSound('snd/userOnline.webm');
		}
	}
	// Handle buddy status change to 'available'
	else if ($(presence).find('show').text() === '' || $(presence).find('show').text() === 'chat') {
		if ($('#buddy-' + nickname).attr('status') !== 'online') {
			var status = 'online';
			var backgroundColor = '#76BDE5';
			var placement = '#buddiesOnline';
		}
	}
	// Handle buddy status change to 'away'
	else if ($('#buddy-' + nickname).attr('status') !== 'away') {
			var status = 'away';
			var backgroundColor = '#5588A5';
			var placement = '#buddiesAway';
	}
	// Perform status change
	$('#buddy-' + nickname).attr('status', status);
	if (placement) {
		$('#buddy-' + nickname).animate({
			'color': '#FFF',
			'backgroundColor': backgroundColor,
			'borderLeftColor': '#97CEEC'
		});
		$('#buddy-' + nickname).slideUp('fast', function() {
			$(this).insertAfter(placement).slideDown('fast');
		});
	}
	return true;
}

// Bind buddy click actions. Used internally.
function bindBuddyClick(nickname) {
	$('#buddy-' + nickname).click(function() {
		if ($(this).prev().attr('id') === 'currentConversation') {
			$('#userInputText').focus();
			return true;
		}
		if (nickname !== 'main-Conversation') {
			$(this).css('background-image', 'none');
		}
		else {
			$(this).css('background-image', 'url("img/groupChat.png")');
		}
		if (currentConversation) {
			var oldConversation = currentConversation;
			if ($('#buddy-' + oldConversation).attr('status') === 'online') {
				var placement = '#buddiesOnline';
				var backgroundColor = '#76BDE5';
				var color = '#FFF';
			}
			else if ($('#buddy-' + oldConversation).attr('status') === 'away') {
				var placement = '#buddiesAway';
				var backgroundColor = '#5588A5';
				var color = '#FFF';
			}
			else {
				var placement = '#buddiesOffline';
				var backgroundColor = '#222';
				var color = '#BBB';
			}
			$('#buddy-' + oldConversation).slideUp('fast', function() {
				$(this).css('background-color', backgroundColor);
				$(this).css('color', color);
				$(this).css('border-bottom', 'none');
				$(this).insertAfter(placement).slideDown('fast');
			});
		}
		currentConversation = $(this).attr('title');
		initiateConversation(currentConversation);
		$('#conversationWindow').html(conversations[currentConversation]);
		if (($(this).prev().attr('id') === 'buddiesOnline')
			|| (($(this).prev().attr('id') === 'buddiesAway')
			&& $('#buddiesOnline').next().attr('id') === 'buddiesAway')) {
			$(this).insertAfter('#currentConversation');
			conversationSwitch(nickname);
		}
		else {
			$(this).slideUp('fast', function() {
				$(this).insertAfter('#currentConversation').slideDown('fast', function() {
					conversationSwitch(nickname);
				});
			});
		}
	});
}

// Send encrypted file
// File is converted into a base64 Data URI which is then sent as an OTR message.
function sendFile(nickname) {
	var mime = new RegExp('(image.*)|(application/((x-compressed)|(x-zip-compressed)|(zip)))|(multipart/x-zip)');
	var sendFileDialog = '<div class="bar">send encrypted file</div>'
	 + '<input type="file" id="fileSelector" name="file[]" />'
	 + '<input type="button" id="fileSelectButton" class="button" value="Select file" />'
	 + '<div id="fileErrorField"></div>'
	 + 'Only .zip files and images are accepted.<br />'
	 + 'Maximum file size: ' + fileSize + ' kilobytes';
	dialogBox(sendFileDialog, 1);
	$('#fileSelector').change(function() {
		var file = event.target.files;
		var reader = new FileReader();
		reader.onload = (function(theFile) {
			return function(e) {
				otrKeys[nickname].sendMsg(event.target.result);
			};
		})(file[0]);
		if (file[0] && file[0].type.match(mime)) {
			if (file[0].size > (fileSize * 1024)) {
				$('#fileErrorField').text('File cannot be larger than ' + fileSize + ' kilobytes');
			}
			else {
				reader.readAsDataURL(file[0]);
			}
		}
		else {
			$('#fileErrorField').text('Please make sure your file is a .zip file or an image.');
		}
	});
	$('#fileSelectButton').click(function() {
		$('#fileSelector').trigger('click');
	});
}

// Bind buddy menus for new buddies. Used internally.
function bindBuddyMenu(nickname) {
	$('#menu-' + nickname).click(function(event) {
		event.stopPropagation();
		if ($('#buddy-' + nickname).height() === 15) {
			var buddyMenuContents = '<div class="buddyMenuContents" id="' + nickname + '-contents">';
			$(this).css('background-image', 'url("img/up.png")');
			$('#buddy-' + nickname).delay(10).animate({'height': '45px'}, 180, function() {
				$(this).append(buddyMenuContents);
				if (nickname !== myNickname) {
					$('#' + nickname + '-contents').append(
						'<li class="option1">Send Encrypted File</li>'
					);
				}
				$('#' + nickname + '-contents').append(
					'<li class="option2">Display Info</li>'
				);
				$('#' + nickname + '-contents').fadeIn('fast', function() {
					$('.option1').click(function(event) {
						event.stopPropagation();
						sendFile(nickname);
					});
					$('.option2').click(function(event) {
						event.stopPropagation();
						
					});
				});
			});
		}
		else {
			$(this).css('background-image', 'url("img/down.png")');
			$('#buddy-' + nickname).animate({'height': '15px'}, 190);
			$('#' + nickname + '-contents').fadeOut('fast', function() {
				$('#' + nickname + '-contents').remove();
			});
		}
	});
}

// Send your current status to the XMPP server.
function sendStatus() {
	if (currentStatus === 'away') {
		conn.muc.setStatus(chatName + '@' + conferenceServer, myNickname, 'away', 'away');
	}
	else {
		conn.muc.setStatus(chatName + '@' + conferenceServer, myNickname, '', '');
	}
}

// Displays a pretty dialog box with `data` as the content HTML.
// If `closeable = 1`, then the dialog box has a close button on the top right.
// onClose may be defined as a callback function to execute on dialog box close.
function dialogBox(data, closeable, onClose) {
	if ($('#dialogBox').css('top') !== '-450px') {
		return false;
	}
	if (closeable) {
		$('#dialogBoxClose').css('width', '18px');
		$('#dialogBoxClose').css('font-size', '12px');
	}
	$('#dialogBoxContent').html(data);
	$('#dialogBox').animate({'top': '+=460px'}, 'fast').animate({'top': '-=10px'}, 'fast');
	$('#dialogBoxClose').click(function() {
		if ($('#dialogBoxClose').css('width') === '0') {
			return false;
		}
		$('#dialogBox').animate({'top': '+=10px'}, 'fast')
			.animate({'top': '-450px'}, 'fast', function() {
				if (onClose) {
					onClose();
				}
			});
		$('#dialogBoxClose').css('width', '0');
		$('#dialogBoxClose').css('font-size', '0');
		
		$('#userInputText').focus();
	});
	$(document).keydown(function(e) {
		if (e.keyCode === 27) {
			$('#dialogBoxClose').click();
		}
	});
}

// Buttons
// Status button
$('#status').click(function() {
	if ($(this).attr('title') === 'Status: Available') {
		$(this).attr('src', 'img/away.png');
		$(this).attr('alt', 'Status: Away');
		$(this).attr('title', 'Status: Away');
		currentStatus = 'away';
		sendStatus();
	}
	else {
		$(this).attr('src', 'img/available.png');
		$(this).attr('alt', 'Status: Available');
		$(this).attr('title', 'Status: Available');
		currentStatus = 'online';
		sendStatus();
	}
});

// Desktop notifications button
$('#notifications').click(function() {
	if ($(this).attr('title') === 'Desktop Notifications Off') {
		$(this).attr('src', 'img/notifications.png');
		$(this).attr('alt', 'Desktop Notifications On');
		$(this).attr('title', 'Desktop Notifications On');
		desktopNotifications = 1;
		if (Notification.checkPermission()) {
			Notification.requestPermission();
		}
	}
	else {
		$(this).attr('src', 'img/noNotifications.png');
		$(this).attr('alt', 'Desktop Notifications Off');
		$(this).attr('title', 'Desktop Notification Off');
		desktopNotifications = 0;
	}
});

// Audio notifications button
$('#audio').click(function() {
	if ($(this).attr('title') === 'Audio Notifications Off') {
		$(this).attr('src', 'img/sound.png');
		$(this).attr('alt', 'Audio Notifications On');
		$(this).attr('title', 'Audio Notifications On');
		audioNotifications = 1;
	}
	else {
		$(this).attr('src', 'img/noSound.png');
		$(this).attr('alt', 'Audio Notifications Off');
		$(this).attr('title', 'Audio Notifications Off');
		audioNotifications = 0;
	}
});

// Logout button
$('#logout').click(function() {
	logout();
});

// Submit user input
$('#userInput').submit(function() {
	var message = $.trim($('#userInputText').val());
	if (message !== '') {
		if (currentConversation === 'main-Conversation') {
			conn.muc.message(chatName + '@' + conferenceServer, null, message, null);
		}
		else {
			otrKeys[currentConversation].sendMsg(message);
		}
		addtoConversation(message, myNickname, currentConversation);
	}
	$('#userInputText').val('');
	return false;
});

/* Login Form */
$('#chatName').select();
$('#chatName').click(function() {
	$(this).select();
});
$('#nickname').click(function() {
	$(this).select();
});
$('#loginForm').submit(function() {
	$('#chatName').val($.trim($('#chatName').val()));
	$('#nickname').val($.trim($('#nickname').val()));
	chatName = $('#chatName').val();
	if (($('#chatName').val() === '')
		|| ($('#chatName').val() === 'conversation name')) {
		loginFail('Please enter a conversation name.');
		$('#chatName').select();
	}
	else if (!$('#chatName').val().match(/^\w{1,20}$/)) {
		loginFail('Conversation name must be alphanumeric.');
		$('#chatName').select();
	}
	else if (($('#nickname').val() === '')
		|| ($('#nickname').val() === 'nickname')) {
		loginFail('Please enter a nickname.');
		$('#nickname').select();
	}
	else if (!$('#nickname').val().match(/^\w{1,16}$/)) {
		loginFail('Nickname must be alphanumeric.');
		$('#nickname').select();
	}
	// Don't process any login request unless RNG is seeded
	else if (CryptoJS.Fortuna.Ready() === 0) {
		if (!seedRNG()) {
			return false;
		}
		else {
			$('#loginForm').submit();
		}
	}
	// Check if we have an OTR key, if not, generate
	else if (!myKey) {
		worker.postMessage('generateDSA');
		var progressForm = '<br /><p id="progressForm"><img src="img/keygen.gif" '
			+ 'alt="" /><p id="progressInfo"><span>Generating encryption keys...</span></p>';
		dialogBox(progressForm, 0, function() {
			$('#loginForm').submit();
		});
		$('#progressInfo').append(
			'<br />Here is an interesting fact while you wait:'
			+ '<br /><br /><span id="interestingFact">'
			+ CatFacts.getFact() + '</span>'
		);
	}
	else {
		chatName = $('#chatName').val();
		myNickname = $('#nickname').val();
		loginCredentials[0] = randomString(256, 1, 1, 1);
		loginCredentials[1] = randomString(256, 1, 1, 1);
		registerXMPPUser(loginCredentials[0], loginCredentials[1]);
	}
	return false;
});

// Registers a new user on the XMPP server.
function registerXMPPUser(username, password) {
	var registrationConnection = new Strophe.Connection(bosh);
	registrationConnection.register.connect(domain, function(status) {
		if (status === Strophe.Status.REGISTER) {
			$('#loginInfo').html('Registering...');
			registrationConnection.register.fields.username = username;
			registrationConnection.register.fields.password = password;
			registrationConnection.register.submit();
		}
		else if (status === Strophe.Status.REGISTERED) {
			registrationConnection.disconnect();
			delete registrationConnection;
			login(loginCredentials[0], loginCredentials[1]);
			return true;
		}
		else if (status === Strophe.Status.SBMTFAIL) {
			return false;
		}
	});
}

// Logs into the XMPP server, creating main connection/disconnection handlers.
function login(username, password) {
	conn = new Strophe.Connection(bosh);
	conn.connect(username + '@' + domain, password, function(status) {
		if (status === Strophe.Status.CONNECTING) {
			$('#loginInfo').animate({'color': '#999'}, 'fast');
			$('#loginInfo').html('Connecting...');
		}
		else if (status === Strophe.Status.CONNFAIL) {
			if (!loginError) {
				$('#loginInfo').html('Connection failed.');
			}
			$('#loginInfo').animate({'color': '#E93028'}, 'fast');
		}
		else if (status === Strophe.Status.CONNECTED) {
			$('#loginInfo').html('Connected.');
			$('#loginInfo').animate({'color': '#0F0'}, 'fast');
			$('#bubble').animate({'margin-top': '+=0.5%'}, function() {
				$('#bubble').animate({'margin-top': '1.5%'}, function() {
					$('#loginLinks').fadeOut();
					$('#info').fadeOut();
					$('#loginForm').fadeOut();
					$('#bubble').animate({'width': '900px'});
					$('#bubble').animate({'height': '550px'}, function() {
						$('.button').fadeIn();
						$('#buddyWrapper').fadeIn('fast', function() {
							var scrollWidth = document.getElementById('buddyList').scrollWidth;
							$('#buddyList').css('width', (150 + scrollWidth) + 'px');
							if (groupChat) {
								bindBuddyClick('main-Conversation');
								$('#buddy-main-Conversation').delay(2000).click();
							}
						});
						loginError = 0;
						conn.muc.join(chatName + '@' + conferenceServer, myNickname, 
							function(message) {
								if (handleMessage(message)) {
									return true;
								}
							}, 
							function(presence) {
								if (handlePresence(presence)) {
									return true;
								}
							}
						);
					});
				});
			});
		}
		else if (status === Strophe.Status.DISCONNECTED) {
			$('.button').fadeOut('fast');
			$('#userInput').fadeOut(function() {
				$('#conversationInfo').animate({'width': '0'});
				$('#conversationInfo').html('');
				$('#conversationWindow').slideUp(function() {
					$('#buddyWrapper').fadeOut();
					if (!loginError) {
						$('#loginInfo').animate({'color': '#999'}, 'fast');
						$('#loginInfo').html('Thank you for using Cryptocat.');
					}
					$('#bubble').animate({'width': '680px'});
					$('#bubble').animate({'height': '310px'})
						.animate({'margin-top': '5%'}, function() {
							$('#buddyList div').each(function() {
								if ($(this).attr('id') !== 'buddy-main-Conversation') {
									$(this).remove();
								}
							});
							$('#conversationWindow').html('');
							conversations = [];
							loginCredentials = [];
							if (!loginError) {
								$('#chatName').val('conversation name');
							}
							$('#chatName').removeAttr('readonly');
							$('#nickname').val('nickname');
							$('#nickname').removeAttr('readonly');
							$('#newAccount').attr('checked', false);
							$('#info').fadeIn();
							$('#loginLinks').fadeIn();
							$('#loginForm').fadeIn('fast', function() {
								$('#chatName').select();
							});
						});
					$('.buddy').unbind('click');
					$('.buddyMenu').unbind('click');
				});
			});
		}
		else if (status === Strophe.Status.AUTHFAIL){
			loginFail('Authentication failure.');
			$('#chatName').select();
		}
		else if (status === Strophe.Status.ERROR) {
			loginFail('Error ' + status);
			$('#chatName').select();
		}
	});
}

// Logout function
function logout() {
	conn.muc.leave(chatName + '@' + conferenceServer);
	conn.disconnect();
}

// Logout on browser close
$(window).unload(function() {
	logout();
});

})();//:3