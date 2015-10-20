//cwkTODO this helper method should live somewhere
//instead of being copied from startup.js
var getUserNameFromId = function(id) {
    var user = Meteor.users.findOne({
        _id: id
    });

    if (user) {
        if (user.username) {
            return user.username;
        } else if (user.profile && user.profile.name) {
            return user.profile.name;
        } else if (user.emails && user.emails[0]) {
            return user.emails[0].address;
        } else {
            return "Signed In";
        }
    }
};

Template.upload.helpers({
    storedImages: function() {
        var currentGame = Games.findOne();
        var currentRound = Rounds.findOne({
            gameId: currentGame._id,
            roundNumber: currentGame.state
        });
        var imageIds = Object.keys(currentRound.imageToVotesMap);
        var images = Images.find({
            _id: {
                $in: imageIds
            }
        }).fetch();
        for(var i=0; i< images.length; i++){
          images[i].voteCount = currentRound.imageToVotesMap[images[i]._id];
        }
        return images;
    },
    matchUrl: function() {
        var currentGame = Games.findOne();
        var currentRound = Rounds.findOne({
            gameId: currentGame._id,
            roundNumber: currentGame.state
        });
        return currentRound.currentImage ? currentRound.currentImage : "";
    },
    users: function() {
        var currentGame = Games.findOne();
        var userNames = [];
        for (var i=0; i<currentGame.userIds.length; i++) {
            userNames.push( getUserNameFromId(currentGame.userIds[i]) );
        }
        return userNames;
    },
    roundNumber: function() {
        var currentGame = Games.findOne();
        return currentGame.state;
    }
});

var context, canvas;

Template.camera.onRendered(function() {
    canvas = $("#canvas")[0];
    context = canvas.getContext("2d");
    var video = $("#video")[0];

    var videoObj = {
        "video": true
    };
    var errBack = function(error) {
        console.log("Video capture error: ", error.code);
    };

    if (navigator.getUserMedia) { // Standard
        navigator.getUserMedia(videoObj, function(stream) {
            video.src = stream;
            video.play();
        }, errBack);
    } else if (navigator.webkitGetUserMedia) { // WebKit-prefixed
        navigator.webkitGetUserMedia(videoObj, function(stream) {
            video.src = window.URL.createObjectURL(stream);
            video.play();
        }, errBack);
    } else if (navigator.mozGetUserMedia) { // Firefox-prefixed
        navigator.mozGetUserMedia(videoObj, function(stream) {
            video.src = window.URL.createObjectURL(stream);
            video.play();
        }, errBack);
    }
})

Template.camera.events({
    'click button': function() {
        var currentGame = Games.findOne();
        var currentRound = Rounds.findOne({
            gameId: currentGame._id,
            roundNumber: currentGame.state
        });
        context.drawImage(video, 0, 0, 320, 240);
        Meteor.call('addImage', currentRound._id, canvas.toDataURL('image/png'));
    }
});


Template.storedImage.events({
    'click button': function(e) {
        var currentGame = Games.findOne();
        var currentRound = Rounds.findOne({
            gameId: currentGame._id,
            roundNumber: currentGame.state
        });
        Meteor.call("voteImage", currentRound._id, $(e.currentTarget).data().id);
    }
});

Template.newGame.events({
    'click button': function() {
        $.getJSON("http://uifaces.com/api/v1/random", function(data) {
            Meteor.call('newSession', Games.findOne()._id, data.image_urls.epic, function() {
                Router.go('/upload/' + Games.findOne()._id);
            });
        });
    }
});