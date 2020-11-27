(function() {

	'use strict';
	var myCarroussel = angular.module('angularMyCarroussel', []);

	myCarroussel.directive('mcStopEvent', function() {
		return {
			restrict: 'A',
			link: function(scope, element, attr) {
				element.bind(attr.mcStopEvent, function(e) {
					e.stopPropagation();
				});
			}
		};
	});
	myCarroussel.directive('mcDrag', ['$parse', '$timeout', function($parse, $timeout) {
		return {
			restrict: 'A',
			link: function(scope, element, $attr) {

				var fnStart = $parse($attr['mcDragstart']);
				var fnOver = $parse($attr['mcDragover']);
				var fnEnd = $parse($attr['mcDragend']);
				var start = false;
				var drag = false;
				var touchmove;
				element.on('touchstart', function(event) {
					if (start || drag) return;
					setDragStart(event);
				});

				element.on('touchend', function(event) {
					clearTimeout(start);
					$timeout.cancel(touchmove);
					start = false;
					if (drag) {
						setDragEnd(event);
					}
				});
				element.on('touchmove', function(event) {
					if (!drag) return;
					touchmove = $timeout(function() {
						var touchX = event.targetTouches[0].clientX;
						var touchY = event.targetTouches[0].clientY;
						event.posX = touchX - $(element).offset().left;
						if (event.posX <= 0 || event.posX >= $(element).width()) {
							setDragEnd(event);
							return;
						}

						var callback = function() {
							fnOver(scope, {
								$event: event
							});
						};
						scope.$apply(callback);
					}, 0);
				});

				function setDragStart(event) {
					if (drag) return;
					drag = true;
					var touchX = event.targetTouches[0].clientX;
					var touchY = event.targetTouches[0].clientY;
					event.posX = touchX - $(element).offset().left;
					if (event.posX <= 0 || event.posX >= $(element).width()) {
						setDragEnd(event);
						return;
					}
					var callback = function() {
						fnStart(scope, {
							$event: event
						});
					};
					scope.$apply(callback);
				}

				function setDragEnd(event) {
					drag = false;
					var callback = function() {
						fnEnd(scope, {
							$event: event
						});
					};
					scope.$apply(callback);
				}
			}
		};
	}]);

	myCarroussel.directive("myCarroussel", ['$window', '$filter', '$compile', '$templateRequest', '$timeout', '$parse', function($window, $filter, $compile, $templateRequest, $timeout, $parse) {

		return {
			restrict: 'E',
			scope: {
				settings: '=?',
				options: '=?'
			},
			link: function(scope, elem, attrs) {
				$(elem).css('opacity', 0);
				scope.settings = typeof scope.settings == 'undefined' ? {} : scope.settings;
				scope.options = typeof scope.options == 'undefined' ? {} : scope.options;
				/* --------------------------- SETTINGS ----------------------------*/
				/*$scope.myCarrousselSettings={
					'transition':500, 
					'dot':{'dot':true,'type':'rectangle'}, {'dot':true,'type':'dot'},{'dot':true,'type':'carre'}
					'ratio':405/540, 
					'type':'CARROU-2', 
					'animate':{
						'autoplay':false,
						'timer':3000
					}, 
					'render':{
						'lockContainerBtn':true,
						'paddingItem': 6,					
					},
					'drag':true,
					'mediaQuery':[
						{'maxWidth':576,'count':1},
						{'minWidth':576,'maxWidth':768,'count':2},
						{'minWidth':768,'maxWidth':992,'count':3},
						{'minWidth':992,'count':3}
					],
					'templateUrl':'/template/slideShow/slideShow.html'	
				};*/

				scope.vm = {
					'index': [],
					'itemInf': 0,
					'itemSup': 0,
					'sens': 1
				};

				scope.vm.settings = {
					'transition': getSlideTransition(scope.settings),
					'texte': false,
					'render': {},
					'click': false,
					'stopTransition': false,
					'slideCount': 0,
					'type': typeof scope.settings.type === 'undefined' ? "CARROU-1" : scope.settings.type == 'CARROU-2' ? "CARROU-2" : "CARROU-1",
					'sizeContainer': getSizeContainer(),
					'swip': true,
					'templateUrl': typeof scope.settings.templateUrl == 'undefined' || scope.settings.templateUrl === '' ? '/common/template/slideShow/slideShow.html' : scope.settings.templateUrl,
					'settingsDrag': {
						'drag': getSlideDrag(scope.settings),
						'X': 0,
						'ratio': 0,
						'ratio_tmp': 1.4,
						'pas': 0.08,
						'timer': 20,
						'timeout': false,
						'interval': false,
						'instance': 0,
						'killProcess': false
					}
				};

				scope.vm.isrunning = {
					'addItem': false,
					'removeItem': false,
					'swip': false,
					'drag': false,
					'instance': false
				};

				scope.vm.items = {};



				/*--------------- GETTER ------------------*/
				function getItem() {
					var tab = [];

					var items = $(elem).find(".slide-item");
					var j = 0;
					if (items.length > 0) {
						angular.forEach(items, function(item) {

							var param = {
								'img': {},
								'link': {},
								'texte': false,
								'title': false,
								'option': ''
							};
							var link = $(item).find(".slide-link");
							if (link.length > 0) {
								param.link.href = $(link).attr("href") ? $(link).attr("href") : '';
								param.link.title = $(link).attr("title") ? $(link).attr("title") : '';
							}
							var img = $(item).find(".slide-img");
							if (img.length > 0) {
								param.img.src = $(img).attr("src") ? $(img).attr("src") : '';
								param.img.alt = $(img).attr("alt") ? $(img).attr("alt") : 'img-' + j;
							}

							var texte = $(item).find(".slide-text");
							if (texte.length > 0) {

								scope.vm.settings.texte = true;

								param.texte = {};
								param.texte.content = $(texte).find(".slide-text-content").html() ? $(texte).find(".slide-text-content").html() : '';
							}
							var slideTilte = $(item).find(".slide-title");
							if (slideTilte.length > 0) param.title = $(slideTilte).text() ? $(slideTilte).text() : '';
							tab.push(param);
							j++;
						});
					}
					return tab;
				}

				function getSlideRatio(settings) {

					if (typeof settings == 'undefined' || typeof settings.ratio == 'undefined') {
						var img = $(elem).find('.slide-img')[0];
						var ratio = $(img).height() / $(img).width();
						return ratio;
					} else return settings.ratio;
				}

				function getSizeContainer() {
					return $(elem).width();
				}

				function getSlideDot(settings) {
					var dot = typeof settings.dot == 'undefined' ? {} : settings.dot;
					var possibletype = ['carre', 'dot', 'rectangle'];
					var set = {
						'dot': typeof dot.dot == 'undefined' ? false : dot.dot,
						'type': typeof dot.type == 'undefined' ? possibletype[0] : possibletype.indexOf(dot.type) > -1 ? dot.type : possibletype[0]
					};
					return set;
				}

				function getSlideAnimation(settings) {
					var setting = {
						'play': false,
						'autoplay': false,
						'timer': scope.vm.settings.transition * 10,
						'stop': false,
						'listener': false
					};
					if (typeof settings == 'undefined') return setting;
					var animation = typeof settings.animate == 'undefined' ? {} : settings.animate;
					if (typeof animation.autoplay == 'undefined') return setting;
					if (!scope.vm.settings.swip) return setting;
					if (!animation.autoplay) return setting;
					var set = {};
					if (animation.autoplay) {
						set = {
							'timer': typeof animation.timer == 'undefined' ? scope.vm.settings.transition * 2 : animation.timer < scope.vm.settings.transition * 2 ? scope.vm.settings.transition * 2 : animation.timer,
							'play': true,
							'playing': false,
							'stop': false,
							'listener': false,
							'autoplay': true
						};
						return set;
					}
					return setting;
				}

				function getScreenSize() {
					return (scope.vm.settings.sizeContainer < 960);
				}

				function getStateSwip() {
					return (scope.vm.items.length > 3);
				}

				function getStateAnimation(settings) {

					var animation = typeof settings.animate == 'undefined' ? {} : settings.animate;
					if (typeof animation.autoplay == 'undefined') return false;
					if (!animation.autoplay) return false;
					if (scope.vm.settings.slideCount >= scope.vm.items.length) return false;
					return true;
				}

				function getMediaQuery(settings) {
					var mediaQuery = [{
						'maxWidth': 576,
						'count': 1
					}, {
						'minWidth': 576,
						'maxWidth': 768,
						'count': 2
					}, {
						'minWidth': 768,
						'maxWidth': 992,
						'count': 3
					}, {
						'minWidth': 992,
						'count': 3
					}];
					var mediaQueryTmp = [];
					if (typeof settings.mediaQuery == 'undefined') return mediaQuery;
					if (settings.mediaQuery.length < 1) return mediaQuery;
					for (var i = 0; i < settings.mediaQuery.length; i++) {
						var param = {};
						var response = settings.mediaQuery[i];
						if (typeof response.count == 'undefined') return mediaQuery;
						param.maxWidth = typeof response.maxWidth == 'undefined' ? false : response.maxWidth;
						param.minWidth = typeof response.minWidth == 'undefined' ? false : response.minWidth;
						param.count = response.count;
						mediaQueryTmp.push(param);
					}
					return mediaQueryTmp;
				}

				function getSlideTransition(settings) {
					return typeof settings.transition == 'undefined' ? 400 : settings.transition < 400 ? 400 : settings.transition;
				}

				function getSettingsRender(settings) {

					var setting = {
						'paddingItem': 6,
						'textHeight': scope.vm.settings.type == "CARROU-1" ? 344 : 100,
						'lockContainerBtn': false,
						'widthContainerBtn': 68,
						'textWidth': scope.vm.settings.type == "CARROU-1" ? 100 : 220
					};

					if (typeof settings == 'undefined' || typeof settings.render == 'undefined') return setting;
					var render = settings.render;
					var set = {
						'paddingItem': setting.paddingItem,
						'widthContainerBtn': setting.widthContainerBtn,
						'textHeight': setting.textHeight,
						'textWidth': setting.textWidth,
						'lockContainerBtn': typeof render.lockContainerBtn == 'undefined' ? setting.lockContainerBtn : render.lockContainerBtn || !render.lockContainerBtn ? render.lockContainerBtn : setting.lockContainerBtn
					};
					set.widthContainerBtn = set.lockContainerBtn ? 0 : setting.widthContainerBtn;
					set.paddingItem = typeof render.paddingItem == 'undefined' ? setting.paddingItem : render.paddingItem > ((scope.vm.settings.sizeContainer - scope.vm.settings.render.widthContainerBtn) / scope.vm.settings.slideCount) ? setting.paddingItem : render.paddingItem;

					return set;
				}

				function getDragRatio() {
					return (scope.vm.settings.slideCount == 1 ? scope.vm.settings.slideCount * scope.vm.settings.settingsDrag.ratio_tmp : scope.vm.settings.slideCount * 0.6 * scope.vm.settings.settingsDrag.ratio_tmp);
				}

				function getSlideDrag(settings) {
					if (typeof settings.drag == 'undefined') return false;
					if (settings.drag) return true;
					return false;
				}

				function matchMedia(size, setting) {
					if (setting.maxWidth && setting.minWidth) return (size >= setting.minWidth && size < setting.maxWidth);
					else if (setting.maxWidth) return (size < setting.maxWidth);
					else if (setting.minWidth || setting.minWidth === 0) return (size >= setting.minWidth);
					else return false;
				}

				/*--------------- SETTER ------------------*/

				function setSlideTransition(transition) {
					scope.vm.settings.transition = transition;

				}

				function setSlideCount(count) {
					scope.vm.settings.slideCount = count;
				}

				function setSlideDot(settings) {
					if (typeof settings.dot == 'undefined') scope.vm.settings.dot.dot = false;
					else scope.vm.settings.dot.dot = settings.dot;
				}

				function verifySizeAndSetCount(size) {

					for (var u = 0; u < scope.vm.settings.mediaQuery.length; u++) {
						if (matchMedia(size, scope.vm.settings.mediaQuery[u])) {
							scope.vm.settings.mediaQuery[u].count + 2 > scope.vm.items.length ? setSlideCount(scope.vm.items.length - 2) : setSlideCount(scope.vm.settings.mediaQuery[u].count);
							break;
						}
					}
				}

				function setCarrousselClass(css) {
					$(elem).addClass(css);
				}

				function setDragRatio() {
					scope.vm.settings.settingsDrag.ratio = scope.vm.settings.slideCount * scope.vm.settings.settingsDrag.ratio_tmp;
				}

				/*------------- JQUERY ----------------*/
				scope.addItems = function(items) {
					if (scope.vm.isrunning.addItem) return;
					scope.vm.isrunning.addItem = true;

					$timeout(function() {

						var add = false;
						for (var i = 0; i < items.length; i++) {

							scope.vm.settings.animate.play = false;
							if (scope.vm.settings.animate.stop) $timeout.cancel(scope.vm.settings.animate.stop);

							var newItem = items[i];
							if (typeof newItem.img.src != 'undefined') {

								var param = {
									'img': {},
									'link': {},
									'texte': {},
									'title': '',
									'option': ''
								};

								var img = newItem.img;
								param.img.src = img.src;
								param.img.alt = typeof img.alt == 'undefined' ? 'img-' + scope.vm.items.length : img.alt;

								var link = typeof newItem.link == 'undefined' ? {} : newItem.link;
								param.link.href = typeof link.href == 'undefined' ? false : link.href;
								param.link.title = typeof link.title == 'undefined' ? '' : link.title;

								var texte = typeof newItem.texte == 'undefined' ? false : newItem.texte;

								if (texte) {
									param.texte.title = typeof texte.title == 'undefined' ? false : texte.title;
									param.texte.content = typeof texte.content == 'undefined' ? false : texte.content;
									scope.vm.texte = true;
								}
								var title = typeof newItem.title == 'undefined' ? false : newItem.title;
								if (title) param.title = title;
								else param.title = false;
								scope.vm.items.push(param);
								add = true;
							}
							if (add) {
								verifySizeAndSetCount(scope.vm.settings.sizeContainer);
								$timeout(function() {
									getStateSwip();
									setDragRatio();
									scope.declareIndex();
									scope.vm.isrunning.addItem = false;
								}, 150);
							}
						}
					}, 0);
				};

				scope.removeItem = function(index) {
					if (scope.vm.items.length < 1) return;
					if (scope.vm.isrunning.removeItem) return;
					scope.vm.isrunning.removeItem = true;
					if (index > -1 && index < scope.vm.items.length) {

						scope.vm.settings.animate.play = false;
						if (scope.vm.settings.animate.stop) $timeout.cancel(scope.vm.settings.animate.stop);
						scope.vm.items.splice(index, 1);

						verifySizeAndSetCount(scope.vm.settings.sizeContainer);
						$timeout(function() {
							gettStateSwip();
							setDragRatio();
							scope.declareIndex();
							scope.vm.isrunning.removeItem = false;
						}, 150);
					}
				};
				scope.startCarroussel = function() {

					if (scope.vm.settings.swip) {
						scope.vm.settings.animate.autoplay = true;
						scope.vm.settings.animate.play = true;
					}
				};

				scope.stopCarroussel = function() {
					scope.vm.settings.animate.autoplay = false;
					scope.vm.settings.animate.play = false;
					if (scope.vm.settings.animate.stop) $timeout.cancel(scope.vm.settings.animate.stop);
				};

				scope.displayObject = function() {
					console.log('--------------------------------');
					console.log('$scope.myCarrousselFonction={}');
					console.log('$scope.myCarrousselSettings={');
					console.log("	'transition':500,");
					console.log("	'dot':{'dot':true,'type':'rectangle'}, OR {'dot':true,'type':'dot'}, OR{'dot':true,'type':'carre'}");
					console.log("	'ratio':405/540, // ratio = height / width ");
					console.log("	'type':'CARROU-2', OR 'CARROU-1'");
					console.log("	'animate':{");
					console.log("		'autoplay':true,");
					console.log("		'timer':3000");
					console.log("	},");
					console.log("	'render':{");
					console.log("		'lockContainerBtn':true,");
					console.log("		'paddingItem': 6,");
					console.log("	},");
					console.log("	'drag':true,");
					console.log("	'mediaQuery':[");
					console.log("		{'maxWidth':576,'count':1},");
					console.log("		{'minWidth':576,'maxWidth':768,'count':2},");
					console.log("		{'minWidth':768,'maxWidth':992,'count':3},");
					console.log("		{'minWidth':992,'count':3}");
					console.log("	],");
					console.log("	'templateUrl':'/template/....html'");
					console.log("}");
					console.log('<my-carroussel id="id" options="myCarrousselFonction" settings="myCarrousselSettings" >');
					console.log('Carroussel FUNCTION : myCarrousselFonction.addItem(item) , myCarrousselFonction.removeItem(index),  myCarrousselFonction.startCarroussel(), myCarrousselFonction.setSelectIndex()');
					console.log("Carroussel Jquery FUNCTION : $('#id').trigger('add', [[{'img':{'src':'/images/photoSlideShowAppart/photo7.jpg'},'alt':''}]]) , $('#id').trigger('remove', [index]),  $('#id').trigger('start'), $('#id').trigger('stop'), $('#id').trigger('selectItem',[index])");
					console.log('Settings send =>', scope.settings);
					console.log('Carroussel Object =>', scope.vm);
					console.log('');
					console.log('--------------------------------');
				};
				/*------------- JQUERY ----------------*/
				// $("#mybutton").on('click',function(){
				// var c = $("#id");
				// var items = 	[{'img':{'src':'/images/photoSlideShowAppart/photo7.jpg'},'alt':''}]
				// c.trigger('add', [items]);
				// });			

				// <my-carroussel id="ccc" options="myCarrousselFonction" settings="myCarrousselSettings" >
				// </my-carroussel>

				$(elem).on("addItem", function(e, items) {
					e.stopPropagation();
					scope.addItems(items);
				});

				elem.bind("remove", function(e, index) {
					e.stopPropagation();
					scope.removeItem(items);
				});

				elem.bind("play", function(e) {
					e.stopPropagation();
					scope.startCarroussel();
				});

				elem.bind("stop", function(e) {
					e.stopPropagation();
					scope.stopCarroussel();
				});

				elem.bind("selectItem", function(e, index) {
					e.stopPropagation();
					scope.selectIndex(index);
				});

				/*---------------- Js - Angular call ------------------------*/

				// <input type="button"  ng-click="myCarrousselFonction.removeItem(0)" value="DELETE">
				// <input type="button"  ng-click="myCarrousselFonction.startCarroussel()" value="START">
				// <input type="button"  ng-click="myCarrousselFonction.stopCarroussel()" value="STOP">
				// <input type="button" ng-click="myCarrousselFonction.addItem([{'img':{'src':'/images/photoSlideShowAppart/photo7.jpg'}}])"   value="ADD">	

				// <div ng-init="index_car=0"></div>
				// <input type="texte" placeholder="entrer l'index" ng-model="index_car">
				// <input type="button" ng-click="myCarrousselFonction.setSelectIndex(index_car)" value="selection de l'index {{index_car}}"> 	

				/* -------------------- Constructor ----------------*/
				// <my-carroussel id="ccc" options="myCarrousselFonction" settings="myCarrousselSettings" >
				// <div class="container-slide">
				// <div class="slide-item">
				// <a class="slide-link" href="/" title="index">
				// <img class="slide-img" src="/images/photoSlideShowAppart/photo1.jpg" alt="tof1"/>
				// <div class="slide-title">title</div>
				// </a>
				// <div class="slide-text">
				// <div class="slide-text-title">Bonjour Toi</div>
				// <div class="slide-text-content">
				// text ...Lorem ipsu
				// </div>
				// </div>
				// </div>
				// </my-caroussel>	

				angular.extend(scope.options, {
					addItem: function(items) {
						if (scope.vm.isrunning.addItem) return;
						scope.vm.isrunning.addItem = true;


						var add = false;
						for (var i = 0; i < items.length; i++) {

							scope.vm.settings.animate.play = false;
							if (scope.vm.settings.animate.stop) $timeout.cancel(scope.vm.settings.animate.stop);

							var newItem = items[i];
							if (typeof newItem.img.src != 'undefined') {

								var param = {
									'img': {},
									'link': {},
									'texte': {},
									'title': '',
									'option': ''
								};
								var img = newItem.img;
								param.img.src = img.src;
								param.img.alt = typeof img.alt == 'undefined' ? 'img-' + scope.vm.items.length : img.alt;
								var link = typeof newItem.link == 'undefined' ? {} : newItem.link;
								param.link.href = typeof link.href == 'undefined' ? false : link.href;
								param.link.title = typeof link.title == 'undefined' ? '' : link.title;
								var texte = typeof newItem.texte == 'undefined' ? false : newItem.texte;
								if (texte) {
									param.texte.title = typeof texte.title == 'undefined' ? false : texte.title;
									param.texte.content = typeof texte.content == 'undefined' ? false : texte.content;
									scope.vm.texte = true;
								}
								var title = typeof newItem.title == 'undefined' ? false : newItem.title;
								if (title) param.title = title;
								else param.title = false;
								scope.vm.items.push(param);
								add = true;
							}
						}
						if (add) {
							verifySizeAndSetCount(scope.vm.settings.sizeContainer);
							$timeout(function() {
								getStateSwip();
								setDragRatio();
								scope.declareIndex();
								scope.vm.isrunning.addItem = false;
							}, 150);
						}
					},
					removeItem: function(index) {
						if (scope.vm.items.length < 1) return;
						if (scope.vm.isrunning.removeItem) return;
						scope.vm.isrunning.removeItem = true;

						if (index > -1 && index < scope.vm.items.length) {

							scope.vm.settings.animate.play = false;
							if (scope.vm.settings.animate.stop) $timeout.cancel(scope.vm.settings.animate.stop);
							scope.vm.items.splice(index, 1);

							verifySizeAndSetCount(scope.vm.settings.sizeContainer);
							$timeout(function() {
								getStateSwip();
								setDragRatio();
								scope.vm.isrunning.removeItem = false;
								scope.declareIndex();
							}, 150);
						}
					},
					startCarroussel: function() {

						if (scope.vm.settings.swip) {
							scope.vm.settings.animate.autoplay = true;
							scope.vm.settings.animate.play = true;
						}
					},
					stopCarroussel: function() {
						scope.vm.settings.animate.play = false;
						if (scope.vm.settings.animate.stop) $timeout.cancel(scope.vm.settings.animate.stop);
					},
					displayObject: function() {
						console.log('--------------------------------');
						console.log('$scope.myCarrousselFonction={}');
						console.log('$scope.myCarrousselSettings={');
						console.log("	'transition':500,");
						console.log("	'dot':{'dot':true,'type':'rectangle'}, OR {'dot':true,'type':'dot'}, OR{'dot':true,'type':'carre'}");
						console.log("	'ratio':405/540, // ratio = height / width ");
						console.log("	'type':'CARROU-2', OR 'CARROU-1'");
						console.log("	'animate':{");
						console.log("		'autoplay':true,");
						console.log("		'timer':3000");
						console.log("	},");
						console.log("	'render':{");
						console.log("		'lockContainerBtn':true,");
						console.log("		'paddingItem': 6,");
						console.log("	},");
						console.log("	'drag':true,");
						console.log("	'mediaQuery':[");
						console.log("		{'maxWidth':576,'count':1},");
						console.log("		{'minWidth':576,'maxWidth':768,'count':2},");
						console.log("		{'minWidth':768,'maxWidth':992,'count':3},");
						console.log("		{'minWidth':992,'count':3}");
						console.log("	],");
						console.log("	'templateUrl':'/template/....html'");
						console.log("}");
						console.log('<my-carroussel id="id" options="myCarrousselFonction" settings="myCarrousselSettings" >');
						console.log('Carroussel FUNCTION : myCarrousselFonction.addItem(item) , myCarrousselFonction.removeItem(index),  myCarrousselFonction.startCarroussel(), myCarrousselFonction.setSelectIndex()');
						console.log("Carroussel Jquery FUNCTION : $('#id').trigger('add', [items]) , $('#id').trigger('remove', [index]),  $('#id').trigger('start'), $('#id').trigger('stop'), $('#id').trigger('selectItem',[index])");
						console.log('Settings send =>', scope.settings);
						console.log('Carroussel Object =>', scope.vm);
						console.log('');
						console.log('--------------------------------');
					},
					setSelectIndex: function(index) {
						scope.vm.settings.animate.play = false;
						if (scope.vm.settings.animate.stop) $timeout.cancel(scope.vm.settings.animate.stop);
						scope.selectIndex(index);
					}
				});

				angular.element($window).on('resize', function(value) {

					if (scope.vm.settings.sizeContainer == getSizeContainer()) return;

					$timeout(function() {
						var settings = typeof scope.settings == 'undefined' ? {} : scope.settings;
						scope.vm.settings.sizeContainer = getSizeContainer();
						verifySizeAndSetCount(scope.vm.settings.sizeContainer);
						setDragRatio();
						scope.declareIndex();
					});
				});


				/*----------------------- PLAYER ---------------------------------*/
				function play() {
					scope.vm.settings.animate.playing = setInterval(function() {
						if (scope.vm.settings.animate.play) {

							scope.swip('animation', -1, false);
						}
					}, scope.vm.settings.animate.timer);
				}


				/*----------------------- SWIP ---------------------------------*/

				function razStart() {
					scope.vm.isrunning.swip = false;
				}
				scope.swip = function(e, sens, callback) {

					if (scope.vm.isrunning.swip) return;
					scope.vm.isrunning.swip = true;

					if (e != "animation") {
						scope.vm.settings.animate.play = false;
						if (scope.vm.settings.animate.autoplay) {
							$timeout.cancel(scope.vm.settings.animate.stop);
							scope.vm.settings.animate.stop = $timeout(function() {
								scope.vm.settings.animate.play = true;
							}, 8000);
						}
					}
					scope.changeIndex(sens, callback);
				};

				// ------------------------------------- DRAG ----------------------------------------------------

				scope.startDrag = function(e, instance) {

					if (!scope.vm.settings.settingsDrag.drag || !scope.vm.settings.swip || scope.vm.items.length === 0) return;
					console.log('STARTDRAG', instance, e);
					scope.vm.isrunning.drag = false;
					scope.vm.isrunning.instance = false;
					scope.vm.settings.settingsDrag.instance = instance;
					scope.vm.settings.animate.play = false;
					if (scope.vm.settings.animate.stop) $timeout.cancel(scope.vm.settings.animate.stop);
					scope.vm.settings.transition = setSlideTransition(0);
					scope.vm.settings.settingsDrag.X = e.posX;

				};

				function drag(step, raz, instance, callback) {

					if (scope.vm.settings.settingsDrag.instance != instance) {
						scope.vm.isrunning.drag = false;
						return;
					}
					if (scope.vm.settings.settingsDrag.killProcess) {
						scope.vm.isrunning.drag = false;
						return;
					}
					if (step >= scope.vm.settings.settingsDrag.pas) {
						scope.vm.isrunning.drag = true;
						scope.swip('touch-step-1', scope.vm.settings.settingsDrag.pas, false);
						step = step - scope.vm.settings.settingsDrag.pas;
					} else if (step <= -scope.vm.settings.settingsDrag.pas) {
						scope.vm.isrunning.drag = true;
						scope.swip('touch-step-2', -scope.vm.settings.settingsDrag.pas, false);
						step = step + scope.vm.settings.settingsDrag.pas;

					} else if (step !== 0) {
						scope.vm.isrunning.drag = true;
						scope.swip('touch-step-3', step, false);
						step = 0;
					}

					if (step !== 0) {
						$timeout(function() {
							drag(step, raz, instance, callback);
						}, scope.vm.settings.settingsDrag.timer);
						return;
					} else {
						if (raz) {
							var restant = getRestant();

							$timeout(function() {
								drag(restant, false, instance, callback);
							}, scope.vm.settings.settingsDrag.timer);
							return;
						} else {
							scope.vm.isrunning.drag = false;
							if (callback) callback();
						}
					}

				}

				scope.stopDrag = function(e, instance) {
					if (scope.vm.isrunning.instance) return;
					scope.vm.isrunning.instance = true;
					scope.vm.settings.settingsDrag.killProcess = true;
					$timeout(function() {
						scope.vm.settings.settingsDrag.killProcess = false;
						drag(0, true, instance, function() {
							scope.vm.isrunning.drag = false;
							scope.vm.settings.transition = getSlideTransition(scope.settings);
							scope.vm.isrunning.instance = false;
						});
					}, scope.vm.settings.settingsDrag.timer);
					return;
				};

				scope.dragOver = function(e) {
					if (!scope.vm.settings.settingsDrag.drag || !scope.vm.settings.swip) return;
					var size = scope.getCarrouSizeContainer();
					var pas = (((e.posX - scope.vm.settings.settingsDrag.X) * (scope.vm.settings.slideCount)) / size) * scope.vm.settings.settingsDrag.ratio;
					scope.vm.sens = pas < 0 ? -1 : 1;
					scope.vm.settings.settingsDrag.X = e.posX;
					drag(pas, false, scope.vm.settings.settingsDrag.instance);
				};

				function getRestant() {
					var restant = Math.round(Math.abs(scope.vm.index[0].index % 1) * 100) / 100;
					var signe = Math.round((scope.vm.index[0].index % 1) * 100) / 100 > 0 ? 1 : -1;
					if (scope.vm.sens == 1) {
						if (signe == -1) {
							if (restant <= scope.vm.settings.settingsDrag.pas) restant = restant;
							else restant = restant;
						} else {
							if (restant <= scope.vm.settings.settingsDrag.pas) restant = -restant;
							else restant = 1 - restant;
						}
					} else {
						if (signe == -1) {
							if (restant <= scope.vm.settings.settingsDrag.pas) restant = restant;
							else restant = -1 + restant;
						} else {
							if (restant <= scope.vm.settings.settingsDrag.pas) restant = -restant;
							else restant = -restant;
						}
					}
					return restant;
				}
				/*-------------------------- PARAMETRE CARROUSSEL  1 2 ----------------------------------------------*/
				function getCarrouItemWidth() {
					var size = scope.getCarrouSizeContainer();
					var width;
					var count = getCarrouSlideCount();
					if (scope.vm.settings.type == "CARROU-1") {
						width = Math.round(size / count);
						return width;
					} else {

						var widthText = scope.vm.settings.render.textWidth;
						var ratio = 0.3; //30%
						if (scope.vm.settings.slideCount > 1) {
							width = Math.round(size * ratio);
						} else {
							width = Math.round(size * 1);
						}
						return {
							"width": width,
							"widthTexte": width + widthText
						};
					}
				}

				function getCarrouPadding() {

					return scope.vm.settings.slideCount > 1 ? scope.vm.settings.render.paddingItem : 0;

				}

				function getCarrouTextHeight() {
					var textHeight = scope.vm.settings.type == "CARROU-1" && scope.vm.settings.texte ?
						scope.vm.settings.render.textHeight : 0;
					return textHeight;
				}

				function getCarrouSlideCount() {

					var count = scope.vm.settings.type == "CARROU-1" && scope.vm.settings.slideCount > 0 ?
						scope.vm.settings.slideCount : 1;
					return count;
				}

				function getCarrouHeight(width) {

					var size = width;
					var textHeight = getCarrouTextHeight();
					var count = getCarrouSlideCount();
					var height = Math.round((width) * scope.vm.settings.ratio) + textHeight;
					return height;
				}

				function getCarrouHeightImg(width) {

					var padding = getCarrouPadding();
					var size = scope.getCarrouSizeContainer();
					var heightImg = Math.round((width - padding) * scope.vm.settings.ratio);
					return heightImg;
				}

				function getCarrouIndex(i) {
					var index = i - Math.trunc(scope.vm.items.length / 2);
					scope.vm.itemInf = index < scope.vm.itemInf ? index : scope.vm.itemInf;
					scope.vm.itemSup = index > scope.vm.itemSup ? index : scope.vm.itemSup;
					return index;
				}

				function getCarrouOpacity(i) {
					if (scope.vm.settings.type == 'CARROU-1') {
						if (i >= -1 && i <= scope.vm.settings.slideCount) {
							return 1;
						} else return 0;
					}
					if (i >= -scope.vm.settings.slideCount - 1 && i <= scope.vm.settings.slideCount + 1) return 1;
					else return 0;
				}

				function getCarrouZindex(i) {
					if (scope.vm.settings.type == 'CARROU-1') {
						if (i >= 0 && i < scope.vm.settings.slideCount) {
							return 10;
						} else return 0;
					}
					var zindex = scope.vm.items.length - Math.abs(i);
					return zindex;
				}

				function getCarrouScale(i) {
					if (scope.vm.settings.type == 'CARROU-1') return 1;
					// CARROU-2
					var ratio = 20 / 100;
					var scale = 1 - (ratio) * Math.abs(i);
					return Math.round(scale * 100) / 100;
				}


				function getCarrouTranslateX(scale, i, w) {
					var count = scope.vm.settings.slideCount;
					var size = scope.getCarrouSizeContainer();

					if (scope.vm.settings.type == 'CARROU-1') {
						var posX = Math.round(i * w);
						return posX;
					}
					var workArea = size * 0.5 - w.widthTexte * 0.5;

					var X = 0;
					if (i <= 0) {
						if (!scope.vm.settings.texte && i === 0) X = size / 2 - w.width / 2;
						else {
							if (scope.vm.settings.slideCount > 1) X = i * (workArea / count) + workArea;
							else X = i * w.width;
						}
					} else {
						if (scope.vm.settings.slideCount > 1) X = (workArea + w.widthTexte + (i) * (workArea / count) - w.width) + (w.width - w.width * scale);
						else X = i * w.width;
					}
					return X;
				}

				scope.getCarrouTextHeight = function() {
					var height = scope.vm.settings.type == "CARROU-1" ? scope.vm.settings.render.textHeight + 'px' : scope.vm.settings.render.textHeight + '%';
					return height;
				};

				scope.getCarrouTextWidth = function() {
					var width = scope.vm.settings.type == "CARROU-1" ? scope.vm.settings.render.textWidth + '%' : scope.vm.settings.render.textWidth + 'px';
					return width;
				};

				scope.getCarrouSizeContainer = function() {
					return scope.vm.settings.render.lockContainerBtn ? scope.vm.settings.sizeContainer : scope.vm.settings.sizeContainer - scope.vm.settings.render.widthContainerBtn;
				};

				scope.getHeightContainerPrincipal = function() {

					var heightText = getCarrouTextHeight();
					var sizeContainer = scope.getCarrouSizeContainer();
					var width;
					if (scope.vm.settings.type == "CARROU-2") {
						var tmp = getCarrouItemWidth();
						width = tmp.width;
					} else width = getCarrouItemWidth();
					var height = scope.vm.settings.slideCount > 0 ? Math.round((width * scope.vm.settings.ratio) + heightText) : 0;
					return height;
				};

				function getCarrouBrightness(i, sens) {
					var ratio = 20 / 100;
					if (scope.vm.settings.type == "CARROU-1") return 100;
					else return 100 - ratio * 100 * Math.abs(i);
				}

				scope.declareIndex = function() {

					scope.vm.index = [];
					scope.vm.itemInf = 0;
					scope.vm.itemSup = 0;
					var array = {};
					if (scope.vm.settings.type == "CARROU-1") {
						for (var i = 0; i < scope.vm.items.length; i++) {
							array = {};

							array.index = getCarrouIndex(i);
							array.width = getCarrouItemWidth();

							array.height = getCarrouHeight(array.width);
							array.scale = getCarrouScale(array.index);
							array.transformX = getCarrouTranslateX(array.scale, array.index, array.width);
							array.padding = getCarrouPadding();
							array.heightImg = getCarrouHeightImg(array.width);
							array.zindex = getCarrouZindex(array.index);
							array.opacity = getCarrouOpacity(array.index);
							array.brightness = getCarrouBrightness(array.index);
							scope.vm.index.push(array);
						}
					} else if (scope.vm.settings.type == "CARROU-2") {

						for (var p = 0; p < scope.vm.items.length; p++) {
							array = {};

							array.index = getCarrouIndex(p);

							array.scale = getCarrouScale(array.index);
							array.zindex = getCarrouZindex(array.index);

							array.width_tmp = getCarrouItemWidth();

							array.height = getCarrouHeight(array.width_tmp.width);

							array.width = array.width_tmp.width;

							array.heightImg = array.height;
							array.transformX = getCarrouTranslateX(array.scale, array.index, array.width_tmp);
							array.padding = 0;

							array.brightness = getCarrouBrightness(array.index);
							array.opacity = getCarrouOpacity(array.index);
							scope.vm.index.push(array);
						}
					}
					scope.selectDotIndex(0);
				};

				scope.selectDotIndex = function(index) {
					if (index > scope.vm.items.length - 1 || index < 0) return;
					setSlideTransition(0);
					if (scope.vm.index[0].index % 1 !== 0) {
						var restant = getRestant();
						scope.swip('selectDotIndex', restant, false);
					}
					var decalage = -scope.vm.index[index].index;
					scope.swip('selectDotIndex', decalage, function() {
						scope.vm.settings.transition = getSlideTransition(scope.settings);
					});

				};

				scope.selectIndex = function(index) {
					if (index > scope.vm.items.length - 1 || index < 0) return;
					setSlideTransition(0);
					if (scope.vm.index[0].index % 1 !== 0) {
						var restant = getRestant();
						scope.swip('selectDotIndex', restant, false);
					}
					var decalage = -scope.vm.index[index].index;
					scope.swip('selectDotIndex', decalage, function() {
						scope.vm.settings.transition = getSlideTransition(scope.settings);
					});
				};

				scope.changeIndex = function(indice, callback) {
					var reminder = false;
					var restant = 0;
					var sens = Math.round(indice * 100) / 100;
					if (indice === 0) {
						if (callback) callback();
						razStart();
						return;
					}
					scope.vm.sens = sens > 0 ? 1 : -1;
					if (sens > 0) {
						if (sens > 1) {
							reminder = true;
							restant = sens - 1;
							sens = 1;
						}
						for (var i = 0; i < scope.vm.index.length; i++) {

							if (scope.vm.index[i].index + sens >= scope.vm.itemSup + 1) scope.vm.index[i].index = Math.round((scope.vm.itemInf - ((scope.vm.itemSup + 1) - (scope.vm.index[i].index) - sens)) * 100) / 100;
							else scope.vm.index[i].index = Math.round((scope.vm.index[i].index + sens) * 100) / 100;
							scope.vm.index[i].scale = getCarrouScale(scope.vm.index[i].index);
							scope.vm.index[i].brightness = getCarrouBrightness(scope.vm.index[i].index);
							scope.vm.index[i].transformX = getCarrouTranslateX(scope.vm.index[i].scale, scope.vm.index[i].index, scope.vm.settings.type == "CARROU-1" ? scope.vm.index[i].width : scope.vm.index[i].width_tmp);
							scope.vm.index[i].opacity = getCarrouOpacity(scope.vm.index[i].index);
							scope.vm.index[i].zindex = getCarrouZindex(scope.vm.index[i].index);
						}
					} else if (sens < 0) {
						if (sens < -1) {
							reminder = true;
							restant = sens + 1;
							sens = -1;
						}

						for (var j = 0; j < scope.vm.index.length; j++) {
							if (scope.vm.index[j].index + sens <= scope.vm.itemInf - 1) scope.vm.index[j].index = Math.round((scope.vm.itemSup - ((scope.vm.itemInf - 1) - (scope.vm.index[j].index) - sens)) * 100) / 100;
							else scope.vm.index[j].index = Math.round((scope.vm.index[j].index + sens) * 100) / 100;
							scope.vm.index[j].scale = getCarrouScale(scope.vm.index[j].index);
							scope.vm.index[j].brightness = getCarrouBrightness(scope.vm.index[j].index);
							scope.vm.index[j].transformX = getCarrouTranslateX(scope.vm.index[j].scale, scope.vm.index[j].index, scope.vm.settings.type == "CARROU-1" ? scope.vm.index[j].width : scope.vm.index[j].width_tmp);
							scope.vm.index[j].opacity = getCarrouOpacity(scope.vm.index[j].index);
							scope.vm.index[j].zindex = getCarrouZindex(scope.vm.index[j].index);
						}
					}

					if (reminder) {
						if (scope.vm.settings.transition === 0) {
							scope.changeIndex(restant, callback);
							return;
						} else {
							$timeout(function() {
								scope.changeIndex(restant, callback);
								return;
							}, scope.vm.settings.transition);
						}
					} else {
						$timeout(function() {
							if (callback) callback();
							razStart();
						}, scope.vm.settings.transition + 7);
					}
				};

				// ------------------------------------- LOADED ----------------------------------------------------

				function loaded() {

					$templateRequest(scope.vm.settings.templateUrl).then(function(html) {
						elem.html("");
						elem.append($compile(html)(scope));
						$(elem).css('opacity', 1);
						play();
						// scope.displayObject();

					});

				}
				scope.initialise = function() {
					scope.vm.settings.ratio = getSlideRatio(scope.settings);
					scope.vm.settings.mediaQuery = getMediaQuery(scope.settings);
					verifySizeAndSetCount(scope.vm.settings.sizeContainer);
					scope.vm.settings.settingsDrag.ratio = getDragRatio();
					scope.vm.settings.dot = getSlideDot(scope.settings);
					scope.vm.settings.render = getSettingsRender(scope.settings);
					scope.vm.settings.swip = getStateSwip();
					scope.vm.settings.animate = getSlideAnimation(scope.settings);
					setCarrousselClass("js");
					scope.declareIndex();
				};
				scope.vm.items = getItem();
				scope.initialise();
				loaded();
			}
		};

	}]);

	myCarroussel.filter("carroussel_round", function() {
		return function(input) {
			return Math.round(input);
		};
	});
	myCarroussel.filter('carroussel_to_trust', ['$sce', function($sce) {
		return function(text) {
			return $sce.trustAsHtml(text);
		};
	}]);

})();