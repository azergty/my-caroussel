# my-carroussel for Angular 

Angular 1.6.9 => https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.6.9/angular.min.js
Jquery 3.4.1 => https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js


how to use it : 

##on your main main page : 

<my-carroussel id="id" options="myCarrousselFonction" settings="myCarrousselSettings" >
         //FOR one item  
        <div class="container-slide">   
           <div class="slide-item">  
              <a class="slide-link" href="/" title="index">  
               <img class="slide-img" src="/images/photos/my_image.jpg ....." alt="my_image"/>  
               <div class="slide-title">title</div>  
             </a>  
             <div class="slide-texte">  
                <div class="slide-texte-content">  
                     /* Put your content here  
                      you can use additionnal tag as div, link etc etc .  
                      Hello world   
                      Lorem ipsumd olor sit amet,consectet ....  */ 
               </div>  
             </div>  
           </div>  
            //For second ITEm ... etc etc   
    </my-carroussel>``  


##on your main.js : 
var app = angular.module('editor',['angularMyCarroussel']);

$scope.myCarrousselFonction={}; // => to acces some carroussel function; <my-carroussel id="id" options="myCarrousselFonction">
$scope.myCarrousselSettings={}; //=> for settings <my-carroussel id="id" options="myCarrousselFonction" settings="myCarrousselSettings" >


Settings : 
    $scope.myCarrousselSettings={
      'transition':500, 
      'dot':{'dot':true,'type':'rectangle'} OR  {'dot':true,'type':'dot'} OR {'dot':true,'type':'carre'},
      'ratio':405/540, // => ratio = height / width image
      'type':'CARROU-2', // => type of carroussel : CARROU-1 OR CARROU-2
      'animate':{
        'autoplay':false, // animation autoplay
        'timer':3000
      }, 
      'render':{
        'lockContainerBtn':true, // some render 
        'paddingItem': 6,					
      },
      'drag':true, // Autorise phone drag
      'mediaQuery':[
        {'maxWidth':576,'count':1}, // your media query with 'count' parameter (number of item on screen)
        {'minWidth':576,'maxWidth':768,'count':2},
        {'minWidth':768,'maxWidth':992,'count':3},
        {'minWidth':992,'count':3}
      ],
      'templateUrl':'/template/slideShow/slideShow.html'	// template link
    };



#How to use function in DOM angular : 

<input type="button"  ng-click="myCarrousselFonction.removeItem(0)" value="DELETE">
<input type="button"  ng-click="myCarrousselFonction.startCarroussel()" value="START">
<input type="button"  ng-click="myCarrousselFonction.stopCarroussel()" value="STOP">
<input type="button" ng-click="myCarrousselFonction.addItem([{'img':{'src':'/images/photos/photo7.jpg'}}])"   value="ADD">
<div ng-init="index_car=0"></div>
<input type="texte" placeholder="entrer index" ng-model="index_car">
<input type="button" ng-click="myCarrousselFonction.setSelectIndex(index_car)" value="select index {{index_car}}">



#How to use function in jquery :

    $("#mybutton").on('click',function(){
      var c = $("#id");
      var items = 	[{'img':{'src':'/images/photoSlideShowAppart/photo7.jpg'},'alt':''}]
      c.trigger('add', [items]);
    });





#FOR more information, create button and click. You will see some information on your debug tool about function.. :
  <input type="button"  ng-click="myCarrousselFonction.displayObject()" value="SHOW">




ENJOY
Azergty




