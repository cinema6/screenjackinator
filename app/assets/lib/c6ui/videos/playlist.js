(function() {
    'use strict';

    angular.module('c6.ui')
        .directive('c6Playlist', ['$timeout', '$log',
            function($timeout, $log){
            function linker(scope,element,attrs,ctlr){
                var showPlayer = function(videoToShow) {
                    angular.forEach(scope.videos, function(video) {
                        video.showPlayer = (videoToShow === video);
                    });
                },
                activatePlayerTimeout;

                $log.info('c6PlayList is linked, scope.id=' + scope.$id +
                    ', playList.id=' + attrs.id +
                    ', url=' + scope.url +
                    ', buffers='  + scope.buffers);

                if (!attrs.id){
                    throw new SyntaxError('c6PlayList requires an id attribute');
                }

                if (!scope.url) {
                    throw new SyntaxError('c6PlayList requires an x-url attribute');
                }

                if (!scope.buffers) {
                    $log.warning('No x-buffers attribute found, default to 1');
                }

                scope.isPlaying = false;

                scope.playerBuffers = [];
                for (var i = 0; i < scope.buffers; i++){
                    scope.playerBuffers.push('buffer' + i.toString());
                }

                scope.loadPlayList(attrs.id,scope.url,function(err){
                    if (err){
                        $log.error('loadPlayList Failed: ' + err.message);
                        return;
                    }

                    $log.log('PlayList is loaded.');
                    if (scope.model.clients.length === scope.buffers){
                        scope.setReady();
                    }
                });

                scope.$on('c6video-ready',function(evt,video){
                    $log.info('New video: ' + video.id);
                    video.playListClient = scope.addNodeClient(video.id);

                    if (!scope.videos){
                        scope.videos = {};
                    }
                    scope.videos[video.id] = video;

                    video.on('ended', function(){
                        $log.info('Ended: ' + video.playListClient.node.name);
                        scope.isPlaying = false;
                        video.fullscreen(false);
                        if (scope.model.currentClient.isTerminal()){
                            $log.log('Done with choices, go back to landing');
                            ctlr.emit('endOfPlayList');
                            return;
                        }
                        ctlr.emit('endOfPlayListItem');
                    });

                    if (scope.model.clients.length === scope.buffers){
                        if (scope.model.playList !== null){
                            scope.setReady();
                        }
                    }
                });

                scope.$on('stop', function(){
                    $log.log('received stop');
                    scope.isPlaying = false;
                    angular.forEach(scope.videos,function(video/*,videoId*/){
                        showPlayer(null);
                        if (video.hasPlayed() && video.player.readyState > 1){
                            video.player.pause();

                            if (video.player.currentTime !== 0) {
                                video.player.currentTime = 0;
                            }
                        }
                    });
                });

                scope.$on('loadStarted', function(evt, playListClient){
                    $log.log('loadStarted ' + playListClient +
                        ', startTime: ' + playListClient.startTime);
                    var video = scope.videos[playListClient.id],
                        failsafeTimeout,
                        readyEvent = 'loadeddata',
                        readyState = 1,
                        seekToRequestedTime = function(event, video) {
                            if (event) {
                                // If this function was called by an event handler.
                                video.off(event.type, seekToRequestedTime);
                            }

                            if (video.player.readyState >= readyState) { // Need to be EXTRA careful...
                                if (!video.player.seekable.length) {
                                    video.on('progress', seekToRequestedTime);
                                    return;
                                }

                                video.player.currentTime = playListClient.startTime;

                                // Setting the currentTime could've caused the video state to change.
                                // Wait for the frame to load before showing the player.
                                if (!video.player.seeking) {
                                    completeLoad();
                                } else {
                                    video.on('seeked', completeLoad);
                                    failsafeTimeout = $timeout(function() {
                                        if (!video.player.seeking) {
                                            completeLoad();
                                        }
                                    }, 4000);
                                }
                            }
                        },
                        completeLoad = function(event) {
                            if (event) {
                                // If this function was called by an event handler.
                                video.off('seeked', completeLoad);
                            }

                            if (failsafeTimeout) {
                                $timeout.cancel(failsafeTimeout);
                                failsafeTimeout = undefined;
                            }

                            if (!video.player.paused) {
                                video.player.pause();
                            }

                            activatePlayerTimeout = $timeout(function() {
                                showPlayer(video);
                                scope.$emit('playerBecameActive', video);
                            }, 250);
                        };

                    if (activatePlayerTimeout) {
                        $timeout.cancel(activatePlayerTimeout);
                        activatePlayerTimeout = undefined;
                    }

                    if (failsafeTimeout) {
                        $timeout.cancel(failsafeTimeout);
                        failsafeTimeout = undefined;
                    }

                    if (playListClient.startTime > 0) {
                        showPlayer(null);
                        $timeout(function() {
                            if (video.player.readyState >= readyState) {
                                seekToRequestedTime(null, video);
                            } else {
                                video.on(readyEvent, seekToRequestedTime);
                            }
                        });
                    } else {
                        completeLoad();
                    }
                });

                scope.$on('loadComplete', function(evt, playListClient){
                    $log.log('loadComplete ' + playListClient);


                });

                scope.$on('play', function(){
                    $log.log('Play the current video: ' + scope.model.currentClient.id);
                    var video = scope.videos[scope.model.currentClient.id];
                    $log.info('Player [' + scope.model.currentClient.id + '], buffered: ' +
                        (video.bufferedPercent() * 100) + '%');
                    scope.isPlaying = true;
                    video.player.play();
                    //video.showPlayer = true;
                    $log.log('SHOW PLAYER [' + scope.model.currentClient.id + ']: ' +
                        scope.videos[ scope.model.currentClient.id].showPlayer);
                });

            }
            return {
                controller   : 'C6PlaylistController',
                restrict     : 'A',
                template     : (function() {
                                    return '<div class="bg-black">' +
                                                '<div class="c6-resize--50_50" c6-resize>' +
                                                    '<div class="border__group ">' +
                                                        '<div class="border__top">&nbsp;</div>' +
                                                        '<div class="border__right">&nbsp;</div>' +
                                                        '<div class="border__bottom">&nbsp;</div>' +
                                                        '<div class="border__left">&nbsp;</div>' +
                                                    '</div>' +
                                                    '<ul class="player__stack">' +
                                                        '<li ng-repeat="buffId in playerBuffers" class="player__item"' +
                                                            'ng-class="{\'player__item--active\': videos[buffId].showPlayer}"' +
                                                            'ng-show="videos[buffId].showPlayer">' +
                                                            '<video c6-video id="{{buffId}}" c6-src="model.cli[buffId].data.src"' +
                                                                'preload="auto" class="video__item"> </video>' +
                                                        '</li>' +
                                                    '</ul>' +
                                                '</div>' +
                                            '</div>';

                                })(),
                replace      : true,
                scope        : { buffers : '=', url : '=' },
                link         : linker
            };
        }])

        .controller('C6PlaylistController',['$scope','$log','$http','c6EventEmitter',
                                            function($scope,$log,$http,c6EventEmitter){
            $log.log('Create c6PlayListCtlr: scope.id=' + $scope.$id);

            // Turn me into an emitter
            var self = c6EventEmitter(this);

            // Our model
            var model = {
                id               : null,
                playList         : null,
                playListData     : null,
                playListDict     : null,
                currentNode      : null,
                currentClient    : null,
                clients          : [],
                cli              : {},
                inTrans          : false,
                ready            : false
            };

            /*****************************************************
             *
             * Scope Decoration
             *
             * Data and methods for the PlayList Directive
             * which creates a private scope when instantiating
             * the PlayList Controller.
             */

            $scope.model = model;

            $scope.setReady = function(){
                model.ready = true;
                $scope.$emit('c6PlayListReady',self);
            };

            $scope.loadPlayList = function(id, rqsUrl, callback){
                $log.log('Loading playlist: ' + id);
                model.id = id;
                var  req = $http({method: 'GET', url: (rqsUrl)});

                $log.info('Requesting: ' + rqsUrl);

                req.success(function(data/*,status,headers,config*/){
                    $log.info('PlayList request succeeded');
                    self._compilePlayList( data, model );
                    callback(null);
                    return;
                });

                req.error(function(data,status/*,headers,config*/){
                    $log.error('PlayList request fails: ' + status);
                    callback( {
                        message : 'Failed with: ' + status,
                        statusCode : status
                    });
                });
            };


            $scope.addNodeClient = function(clientId){
                var result = {
                    id  : clientId,
                    active : false,
                    startTime : 0,
                    node : {},
                    data : {},

                    clear : function(){
                        this.active = false;
                        this.startTime = 0;
                        this.node = {};
                        this.data = {};
                    },

                    isTerminal : function() {
                        if ((this.node.branches) && (this.node.branches.length > 0)){
                            return false;
                        }
                        return true;
                    },

                    getChildNodeByName : function(name){
                        var result = null;
                        if (this.node){
                            angular.forEach(this.node.branches,function(nd){
                                if ((result === null) && (nd.name === name)){
                                    result = nd;
                                }
                            });
                        }
                        return result;
                    },

                    toString : function(){
                        return 'NC [' + this.id + '][' +
                            ((this.node.name === undefined) ? 'null' : this.node.name) + ']';
                    }
                };
                $log.info('Add client: ' + result);
                model.clients.push(result);

                model.cli[clientId] = result;

                return result;
            };

            /*
             * Scope Decoration  -- End
             *****************************************************/


            /*****************************************************
             *
             * Public interace
             *
             */

            this.id            = function() { return model.id;            };

            this.currentNodeName = function() {
                if (model.currentNode){
                    return model.currentNode.name;
                }
                return null;
            };

            this.currentNodeId = function() {
                return model.currentNode && model.currentNode.id;
            };

            this.getCurrentBranches= function(){
                var currentBranches = model.currentNode.branches, result = [];
                for (var i = 0; i < currentBranches.length; i++){
                    result.push({
                        id   : currentBranches[i].id,
                        name : currentBranches[i].name
                    });
                }
                return result;
            };

            this.getBranchesForNode = function(nodeId){
                var nd = model.playListDict[nodeId], branches, result;
                if (!nd) {
                    throw new Error('Invalid nodeId [' + nodeId + ']');
                }
                result = [];
                branches = nd.branches;
                for (var i = 0; i < branches.length; i++){
                    result.push({
                        id   : branches[i].id,
                        name : branches[i].name
                    });
                }
                return result;
            };

            this.getDataForNode = function(nodeId) {
                var node = model.playListDict[nodeId],
                    data = model.playListData[node.name],
                    record = {};

                record.id       = node.id;
                record.name     = node.name;
                record.duration = data.duration;
                record.label    = data.label;
                record.siblings = [];
                if (node.parent){
                    record.parentId = node.parent.id;
                    angular.forEach(node.parent.branches,function(branch){
                        if (branch.id !== record.id){
                            record.siblings.push({
                                id   : branch.id,
                                name : branch.name
                            });
                        }
                    });
                }

                return record;
            };

            // Transitioning from one video to the next is a complicated process
            // as some parts of the UI may update as soon as the next node is
            // selected, while others shouldn't be updated until after the
            // next node's video is starting to play.  This in part is driven by
            // the need to load videos into a video element before playing them.

            // Load is part 1 of a two part transaction.  Its job is basically to
            // link the selected node to the current client.  If there is already
            // a client that has been assigned that node, that client becomes
            // the current client.  Otherwise it will assign the node to the
            // current client.  See play for part 2.
            this.load = function(nextNodeId, startTime, andComplete){
                var nextClient = null,
                    nd = model.playListDict[nextNodeId];

                $log.log(   'nextNodeId: ' + nextNodeId +
                            ', startTime: ' + startTime +
                            ', andComplete: ' + andComplete );
                if (startTime === undefined) {
                    startTime = 0;
                }

                if (!nd){
                    $log.error('Unable to locate node with id: ' + nextNodeId);
                    return this;
                }

                if (model.clients.length === 0){
                    $log.error('Need at least one client to load node with id: ' + nextNodeId);
                    return this;
                }

                $log.info('Load node: ' + nd);
                model.inTrans = true;

                //Check if any of our clients already have the node
                angular.forEach(model.clients,function(client){
                    if (    (nextClient === null) &&
                            (client.node === nd) ){
                        nextClient = client;
                    }
                });

                if (nextClient !== null){
                    // We found a client with the node, assign to currentClient and return
                    $log.info('TRANS ' + model.currentClient + ' ==> ' + nextClient);
                    model.currentClient = nextClient;
                    model.currentClient.startTime = startTime;
                    $scope.$emit('loadStarted', model.currentClient);

                    if (andComplete){
                        this.completeLoad();
                    }

                    return;
                }

                if (model.currentClient){
                    // None of our clients have that node so we will assign it
                    // to our current client (probably means we only have a single client)
                    $log.info('Set currentClient ' +
                            model.currentClient + ' node to ' + nd);

                    this._setClientWithNode(model.currentClient,nd);

                    model.currentClient.startTime = startTime;
                    $scope.$emit('loadStarted', model.currentClient);
                }

                if (andComplete){
                    this.completeLoad();
                }
            };

            // completeLoad is the second part of the transaction initiated by load.  It will
            // update the current node and if there is more than one client, will map
            // the new current node's branches to the other clients.
            this.completeLoad = function() {
                if (model.inTrans) {
                    model.inTrans = false;
                    model.currentNode = model.currentClient.node;
                    this._mapNodesToClients(model.currentClient);
                    model.currentClient.active = true;
                    $scope.$emit('loadComplete', model.currentClient);
                }
            };

            this.play = function(){
                this.completeLoad();
                $scope.$emit('play');
            };

            this.start = function(){
                if (model.playList === null){
                    $log.error('Must load a playList before starting');
                    return this;
                }
                if (model.clients.length === 0){
                    $log.error('Must load at least one client before starting');
                    return this;
                }

                model.currentNode   = model.playList;
                model.currentClient = model.clients[0];
                this.load(model.playList.id, 0, true);
            };

            this.stop = function() {
                $scope.$emit('stop');
            };

            /*
             * Public Interface -- End
             *****************************************************/

            this._mapNodesToClients = function(){
                var self         = this,
                    clients      = [],
                    nodes        = model.currentClient.node.branches.concat(),
                    client;

                angular.forEach(model.clients,function(v){
                    if (v !== model.currentClient) {
                        clients.push(v);
                    }
                });

                $log.info(  'mapFrom (' + model.currentClient +
                            '): clients to map: ' + clients.length +
                            ', nodes: ' + nodes.length);

                // Iterate through each client
                for (var i = 0; i < clients.length; i++) {
                    $log.info('eval vn: ' + clients[i] + ',i=' + i);
                    if (!clients[i].node) {
                        $log.info('vn has no node: ' + clients[i]);
                        continue;
                    }
                    // Compare the client's node to each of the child nodes
                    // so if a client is already pointing to a particular
                    // node (and ie loaded its video) we can keep it there
                    var matched = false;
                    for (var j = 0; j < nodes.length; j++) {
                        $log.info('eval node:' + nodes[j].name);
                        if ((matched === false) && (clients[i].node.name === nodes[j].name)) {
                            $log.info('Refresh: ' + clients[i] + ', with' + nodes[j]);
                            clients[i].active = false;
                            clients[i].node = nodes[j];
                            clients.splice(i--,1);
                            nodes.splice(j--,1);
                            matched = true;
                        }
                    }
                }

                if (clients.length === 0) {
                    $log.log('We mapped all the clients to nodes that we could!');
                    return;
                }

                angular.forEach(nodes, function(node){
                    client = clients.shift();
                    if (!client) {
                        $log.info('no more clients to map!');
                        return;
                    }

                    $log.info('Setting client ' + client + ' with ' + node.name);
                    self._setClientWithNode(client,node);
                });

                $log.info('finished with nodes, now set any leftover clients to null');
                while ((client = clients.shift())) {
                    $log.info('set to null: ' + client);
                    self._setClientWithNode(client,null);
                }
            };

            this._setClientWithNode = function(client,node){
                client.clear();
                if ((node === null) || (node === undefined)){
                    node = {};
                }
                client.node = node;
                client.data = (node.name) ? model.playListData[node.name] : {};
            };

            this._compilePlayList = function(playList, output){
                if (!output){
                    output = {};
                }
                output.maxBranches     = 0;
                output.playListDict    = {};
                var id = 0;
                output.playList = (function parseTree(currentNode,parentNode) {
                    var newNode = {
                            'id'        :   'n' + id++,
                            'name'      :   currentNode.name,
                            'parent'    :   parentNode,
                            'branches'  :   [],
                            'toString'  : function() { return this.id + ':' + this.name ; }
                        },
                        kids = currentNode.branches.length;

                    output.playListDict[newNode.id] = newNode;

                    if (parentNode !== null) {
                        parentNode.branches.push(newNode);
                    }

                    currentNode.branches.forEach(function(child){
                        parseTree(child,newNode);
                    });

                    if (kids > output.maxBranches) {
                        output.maxBranches = kids;
                    }
                    return newNode;
                }(playList.tree,null));

                output.playListData   = playList.data;

                return output;
            };

        }]);
})();
