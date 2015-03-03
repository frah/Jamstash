describe("Subsonic controller", function() {
    'use strict';

    var scope, $rootScope, $controller, $window, subsonic, notifications, player, controllerParams, deferred;

    beforeEach(function() {
        jasmine.addCustomEqualityTester(angular.equals);

        module('jamstash.subsonic.controller', function ($provide) {
            // Mock the player service
            $provide.decorator('player', function($delegate) {

                $delegate.queue = [];
                $delegate.play = jasmine.createSpy("play");
                $delegate.playFirstSong = jasmine.createSpy("playFirstSong");
                return $delegate;
            });
        });

        inject(function (_$controller_, _$rootScope_, utils, globals, map, $q, _player_) {
            $rootScope = _$rootScope_;
            scope = $rootScope.$new();
            deferred = $q.defer();
            player = _player_;

            $window = jasmine.createSpyObj("$window", [
                "prompt",
                "confirm"
            ]);
            notifications = jasmine.createSpyObj("notifications", ["updateMessage"]);

            // Mock the subsonic service
            subsonic = jasmine.createSpyObj("subsonic", [
                "getAlbums",
                "getArtists",
                "getGenres",
                "getPlaylists",
                "getPodcasts",
                "getRandomStarredSongs",
                "getRandomSongs",
                "getPlaylist",
                "newPlaylist",
                "deletePlaylist"
            ]);
            // We make them return different promises and use our deferred variable only when testing
            // a particular function, so that they stay isolated
            subsonic.getAlbums.and.returnValue($q.defer().promise);
            subsonic.getArtists.and.returnValue($q.defer().promise);
            subsonic.getGenres.and.returnValue($q.defer().promise);
            subsonic.getPlaylists.and.returnValue($q.defer().promise);
            subsonic.getPodcasts.and.returnValue($q.defer().promise);
            subsonic.getRandomStarredSongs.and.returnValue($q.defer().promise);
            subsonic.getRandomSongs.and.returnValue($q.defer().promise);
            subsonic.getPlaylist.and.returnValue($q.defer().promise);
            subsonic.showIndex = false;

            $controller = _$controller_;
            controllerParams = {
                $scope: scope,
                $rootScope: $rootScope,
                $routeParams: {},
                $window: $window,
                utils: utils,
                globals: globals,
                map: map,
                subsonic: subsonic,
                notifications: notifications
            };
        });
    });

    describe("", function() {
        beforeEach(function() {
            $controller('SubsonicController', controllerParams);
            scope.selectedPlaylist = null;
        });

        describe("Given that my library contained 3 songs, ", function() {
            var response;
            beforeEach(function() {
                response = [
                    {id:"2548"}, {id:"8986"}, {id:"2986"}
                ];
            });

            describe("", function() {
                beforeEach(function() {
                    spyOn(scope, "requestSongs").and.returnValue(deferred.promise);
                });

                it("when I request random starred songs, it uses subsonic-service, delegates to requestSongs displaying, adding or playing songs and sets the scope's current playlist", function() {
                    scope.getRandomStarredSongs('whatever action');
                    deferred.resolve(response);
                    scope.$apply();

                    expect(subsonic.getRandomStarredSongs).toHaveBeenCalled();
                    expect(scope.requestSongs).toHaveBeenCalledWith(deferred.promise, 'whatever action');
                    expect(scope.selectedPlaylist).toBeNull();
                    expect(scope.selectedAutoPlaylist).toBe('starred');
                });

                it("when I request random songs from all folders or genres, it uses subsonic-service, delegates to requestSongs displaying, adding or playing songs and sets the scope's current playlist", function() {
                    scope.getRandomSongs('whatever action');
                    deferred.resolve(response);
                    scope.$apply();

                    expect(subsonic.getRandomSongs).toHaveBeenCalled();
                    expect(scope.requestSongs).toHaveBeenCalledWith(deferred.promise, 'whatever action');
                    expect(scope.selectedPlaylist).toBeNull();
                    expect(scope.selectedAutoPlaylist).toBe('random');
                });

                it("when I request random songs from a given genre, it uses subsonic-service, delegates to requestSongs displaying, adding or playing songs and sets the scope's current playlist", function() {
                    scope.getRandomSongs('whatever action', 'Rock');
                    deferred.resolve(response);
                    scope.$apply();

                    expect(subsonic.getRandomSongs).toHaveBeenCalledWith('Rock', undefined);
                    expect(scope.requestSongs).toHaveBeenCalledWith(deferred.promise, 'whatever action');
                    expect(scope.selectedPlaylist).toBeNull();
                    expect(scope.selectedAutoPlaylist).toBe('Rock');
                });

                it("when I request random songs from a given folder id, it uses subsonic-service, delegates to requestSongs displaying, adding or playing songs and sets the scope's current playlist", function() {
                    scope.getRandomSongs('whatever action', '', 1);
                    deferred.resolve(response);
                    scope.$apply();

                    expect(subsonic.getRandomSongs).toHaveBeenCalledWith('', 1);
                    expect(scope.requestSongs).toHaveBeenCalledWith(deferred.promise, 'whatever action');
                    expect(scope.selectedPlaylist).toBeNull();
                    expect(scope.selectedAutoPlaylist).toBe(1);
                });

                it("given a playlist that contains those 3 songs, when I request it, it uses subsonic-service, delegates to requestSongs displaying, adding or playing the songs of the playlist and sets the scope's current playlist", function() {
                    scope.getPlaylist('whatever action', 1146);
                    deferred.resolve(response);
                    scope.$apply();

                    expect(subsonic.getPlaylist).toHaveBeenCalledWith(1146);
                    expect(scope.requestSongs).toHaveBeenCalledWith(deferred.promise, 'whatever action');
                    expect(scope.selectedPlaylist).toBe(1146);
                    expect(scope.selectedAutoPlaylist).toBeNull();
                });

                it("given a playlist that contained those 3 songs, when I display it, it will notify the user with the number of songs in the playlist", function() {
                    scope.getPlaylist('display', 1146);
                    deferred.resolve(response);
                    scope.$apply();

                    expect(notifications.updateMessage).toHaveBeenCalledWith('3 Song(s) in Playlist', true);
                });
            });

            describe("requestSongs -", function() {
                it("when I display songs, it sets the scope with the selected songs", function() {
                    scope.requestSongs(deferred.promise, 'display');
                    deferred.resolve(response);
                    scope.$apply();

                    expect(scope.song).toEqual([
                        {id: "2548"}, {id: "8986"}, {id: "2986"}
                    ]);
                });

                it("when I add songs, it adds the selected songs to the playing queue and notifies the user", function() {
                    scope.requestSongs(deferred.promise, 'add');
                    deferred.resolve(response);
                    scope.$apply();

                    expect(player.queue).toEqual([
                        {id: "2548"}, {id: "8986"}, {id: "2986"}
                    ]);
                    expect(notifications.updateMessage).toHaveBeenCalledWith('3 Song(s) Added to Queue', true);
                });

                it("when I play songs, it plays the first selected song, empties the queue and fills it with the selected songs and it notifies the user", function() {
                    player.queue = [{id: "7666"}];

                    scope.requestSongs(deferred.promise, 'play');
                    deferred.resolve(response);
                    scope.$apply();

                    expect(player.playFirstSong).toHaveBeenCalled();
                    expect(player.queue).toEqual([
                        {id: "2548"}, {id: "8986"}, {id: "2986"}
                    ]);
                    expect(notifications.updateMessage).toHaveBeenCalledWith('3 Song(s) Added to Queue', true);
                });

                it("when I request songs, it returns a promise so that I can chain it further", function() {
                    var success = jasmine.createSpy("success");

                    scope.requestSongs(deferred.promise, 'whatever action').then(success);
                    deferred.resolve(response);
                    scope.$apply();

                    expect(success).toHaveBeenCalled();
                });

                it("when I request songs, it lets handleErrors handle HTTP and Subsonic errors", function() {
                    spyOn(scope, 'handleErrors').and.returnValue(deferred.promise);

                    scope.requestSongs(deferred.promise, 'whatever action');
                    deferred.reject({reason: 'Error when contacting the Subsonic server.',
                        httpError: 404
                    });
                    scope.$apply();

                    expect(scope.handleErrors).toHaveBeenCalledWith(deferred.promise);
                });

                it("given that I don't have any song in my library, when I request songs, it notifies the user with an error message, does not play a song and does not change the queue", function() {
                    player.queue = [{id: "7666"}];

                    scope.requestSongs(deferred.promise, 'whatever action');
                    deferred.reject({reason: 'No songs found on the Subsonic server.'});
                    scope.$apply();

                    expect(player.playFirstSong).not.toHaveBeenCalled();
                    expect(player.queue).toEqual([{id: "7666"}]);
                    expect(notifications.updateMessage).toHaveBeenCalledWith('No songs found on the Subsonic server.', true);
                });
            });
        });

        describe("handleErrors -", function() {
            it("when I make a request, it returns a promise so that I can chain it further", function() {
                var success = jasmine.createSpy("success");

                scope.handleErrors(deferred.promise).then(success);
                deferred.resolve();
                scope.$apply();

                expect(success).toHaveBeenCalled();
            });

            it("given that the Subsonic server returns an error, when I make a request, it notifies the user with the error message", function() {
                scope.handleErrors(deferred.promise);
                deferred.reject({reason: 'Error when contacting the Subsonic server.',
                    subsonicError: {code: 10, message:'Required parameter is missing.'}
                });
                scope.$apply();

                expect(notifications.updateMessage).toHaveBeenCalledWith('Error when contacting the Subsonic server. Required parameter is missing.', true);
            });

            it("given that the Subsonic server is unreachable, when I make a request, it notifies the user with the HTTP error code", function() {
                scope.handleErrors(deferred.promise);
                deferred.reject({reason: 'Error when contacting the Subsonic server.',
                    httpError: 404
                });
                scope.$apply();

                expect(notifications.updateMessage).toHaveBeenCalledWith('Error when contacting the Subsonic server. HTTP error 404', true);
            });
        });

        describe("reorders playlists by drag and drop - ", function() {
            var mockUI;
            beforeEach(function() {
                scope.song = [
                    {id: 1084},
                    {id: 6810},
                    {id: 214}
                ];
                mockUI = {
                    item: {}
                };
            });

            it("given a song in a list of songs, when I start dragging it, it records what its starting position in the list was", function() {
                mockUI.item.index = jasmine.createSpy('index').and.returnValue('1');
                mockUI.item.data = jasmine.createSpy('data');

                scope.dragStart({}, mockUI);

                expect(mockUI.item.index).toHaveBeenCalled();
                expect(mockUI.item.data).toHaveBeenCalledWith('start', '1');
            });

            it("given a song in a list of songs that I started dragging, when I drop it, its position in the list of songs has changed", function() {
                mockUI.item.index = jasmine.createSpy('index').and.returnValue('0');
                mockUI.item.data = jasmine.createSpy('data').and.returnValue('1');

                scope.dragEnd({}, mockUI);

                expect(mockUI.item.index).toHaveBeenCalled();
                expect(mockUI.item.data).toHaveBeenCalledWith('start');
                // The second song should now be first
                expect(scope.song).toEqual([
                    {id: 6810},
                    {id: 1084},
                    {id: 214}
                ]);
            });
        });

        it("When I call playSong, it calls play in the player service", function() {
            var fakeSong = {"id": 3572};

            scope.playSong(fakeSong);

            expect(player.play).toHaveBeenCalledWith(fakeSong);
        });

        //TODO: Hyz: all starred

        describe("When I load the artists,", function() {
            beforeEach(function() {
                subsonic.getArtists.and.returnValue(deferred.promise);
            });

            it("Given that there are songs in the library, it loads the artists and publishes them to the scope", function() {
                scope.getArtists();
                deferred.resolve({
                    index: [
                        {id: "520"}
                    ],
                    shortcut: [
                        {id: "342"}
                    ]
                });
                scope.$apply();

                expect(subsonic.getArtists).toHaveBeenCalled();
                expect(scope.index).toEqual([
                    {id: "520"}
                ]);
                expect(scope.shortcut).toEqual([
                    {id: "342"}
                ]);
            });

            it("Given that there aren't any songs in the library, when loading indexes, it notifies the user with an error message", function() {
                scope.getArtists();
                deferred.reject({reason: 'No artist found on the Subsonic server.'});
                scope.$apply();

                expect(scope.index).toEqual([]);
                expect(scope.shortcut).toEqual([]);
                expect(notifications.updateMessage).toHaveBeenCalledWith('No artist found on the Subsonic server.', true);
            });

            it("it lets handleErrors handle HTTP and Subsonic errors", function() {
                spyOn(scope, 'handleErrors').and.returnValue(deferred.promise);
                scope.getArtists();
                expect(scope.handleErrors).toHaveBeenCalledWith(deferred.promise);
            });
        });

        describe("When I load the playlists,", function() {
            beforeEach(function() {
                subsonic.getPlaylists.and.returnValue(deferred.promise);
            });

            it("Given that there are playlists in the library, it loads the playlists and publishes them to the scope", function() {
                scope.getPlaylists();
                deferred.resolve({
                    playlists: [
                        {id: "588"}
                    ],
                    playlistsPublic: [
                        {id: "761"}
                    ]
                });
                scope.$apply();

                expect(subsonic.getPlaylists).toHaveBeenCalled();
                expect(scope.playlists).toEqual([
                    {id: "588"}
                ]);
                expect(scope.playlistsPublic).toEqual([
                    {id: "761"}
                ]);
            });

            it("Given that there aren't any playlists in the library, it publishes an empty array to the scope and does not notify the user with the error message", function() {
                scope.getPlaylists();
                deferred.reject({reason: 'No playlist found on the Subsonic server.'});
                scope.$apply();

                expect(subsonic.getPlaylists).toHaveBeenCalled();
                expect(scope.playlists).toEqual([]);
                expect(scope.playlistsPublic).toEqual([]);
                expect(notifications.updateMessage).not.toHaveBeenCalled();
            });
        });

        it("When I create a playlist, then it will ask for a name, use subsonic-service and reload the playlists", function() {
            $window.prompt.and.returnValue('declassicize');
            subsonic.newPlaylist.and.returnValue(deferred.promise);
            spyOn(scope, 'getPlaylists');

            scope.newPlaylist();
            deferred.resolve();
            scope.$apply();

            expect($window.prompt).toHaveBeenCalledWith("Choose a name for your new playlist.", "");
            expect(subsonic.newPlaylist).toHaveBeenCalledWith('declassicize');
            expect(scope.getPlaylists).toHaveBeenCalled();
        });

        it("When I create a playlist and provide no name, then the playlist won't be created", function() {
            $window.prompt.and.returnValue(null);

            scope.newPlaylist();

            expect(subsonic.newPlaylist).not.toHaveBeenCalled();
        });

        it("Given a selected playlist, when I delete that playlist, it will ask for confirmation, use subsonic-service and reload the playlists", function() {
            $window.confirm.and.returnValue(true);
            subsonic.deletePlaylist.and.returnValue(deferred.promise);
            spyOn(scope, 'getPlaylists');
            scope.selectedPlaylist = 8885;

            scope.deletePlaylist();
            deferred.resolve();
            scope.$apply();

            expect($window.confirm).toHaveBeenCalledWith('Are you sure you want to delete the selected playlist?');
            expect(subsonic.deletePlaylist).toHaveBeenCalledWith(8885);
            expect(scope.getPlaylists).toHaveBeenCalled();
        });

        it("Given no selected playlist, when I try to delete that playlist, an error message will be notified", function() {
            scope.selectedPlaylist = null;

            scope.deletePlaylist();

            expect(notifications.updateMessage).toHaveBeenCalledWith('Please select a playlist to delete.');
            expect(subsonic.deletePlaylist).not.toHaveBeenCalled();
        });
    });

    describe("On startup,", function() {
        xit("it loads the indexes, the playlists", function() {
            controllerParams.$scope.getArtists = jasmine.createSpy('getArtists');
            controllerParams.$scope.getPlaylists = jasmine.createSpy('getPlaylists');
            // spyOn(scope, 'getArtists');
            // spyOn(scope, 'getPlaylists');

            $controller('SubsonicController', controllerParams);
            expect(scope.getArtists).toHaveBeenCalled();
            expect(scope.getPlaylists).toHaveBeenCalled();

            //TODO: Hyz: Complete with everything called on startup
        });
    });
});
