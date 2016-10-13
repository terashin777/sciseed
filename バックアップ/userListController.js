'use strict';
/**
 * @ngdoc function
 * @name concierAdminApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the concierAdminApp
 */

var LINE_API_URL = 'http://ec2-52-36-83-202.us-west-2.compute.amazonaws.com:9000/api';
angular.module('concierAdminApp')
.controller('UserListCtrl', function($scope, $sce, $state, $http) {

	$("#user_message_wrapper").draggable();

	$scope.serchQuery = {
		"type": "tag",
		"queryTag": "",
          "queryText": "" 
	}
  $scope.lineUserList = [];
  $scope.userTag = [];
  $scope.currnentIndex = -1;

  $scope.tag_add = true;
  $scope.showMessage = false;
  $scope.messageSent = false;

 	$scope.currentTagText={};
  $scope.currentSelectedTag={};
  $scope.currentTagToRemove={};

  $scope.selectedProductId = 1;
  $scope.minLoyalty = 3;
  $scope.loyaltyStr = "3";
  $scope.currentUser;

  $scope.asignee = localStorage.getItem("asignee");

  $scope.getLineUserList = function(){
  
    $http({
      url: LINE_API_URL+"/user_tag?productID="+$scope.selectedProductId+"&token=nishishinjuku",
      method: "GET",
      dataType: "json"
    }).
    success(function(d, status, headers, config) {

        for(var tIdx in d){
          d[tIdx].categoryText = categoryMapper(d[tIdx].category);  
        }

    	  $scope.userTag = d;
        $http({
          url: LINE_API_URL+"/product_user?productID="+$scope.selectedProductId+"&token=nishishinjuku",
          method: "GET",
          dataType: "json"
        }).
        success(function(data, status, headers, config) {
          $scope.lineUserList = data;
        }).
        error(function(data, status, headers, config) {
          
        });     
    }).
    error(function(data, status, headers, config) {
      
    });  
  }

  $scope.openTagAddField = function(user){
    $scope.currentUser = user;
  	$scope.tag_add = true;

  }

  $scope.openTagRemoveField = function(user){
  	$scope.currentUser = user;
  	$scope.tag_add = false;
  }

  $scope.addNewTag = function(){
  	var tagText = $scope.currentTagText[$scope.currentUser.id];
  	var selectedTag = parseInt($scope.currentSelectedTag[$scope.currentUser.id]);
	
  	if(tagText != "" && tagText != undefined){

  		$scope.currentTagText[$scope.currentUser.id] = "";

  		var tagId;
  		for(var i in $scope.userTag){
  			if($scope.userTag[i].name==tagText){
  				tagId = $scope.userTag[i].id;
  			}
  		}

  		if(tagId){

  			if($scope.currentUser.user_tag.indexOf(tagId)!=-1){
  				return;
  			}else{
  				$scope.currentUser.user_tag.push(tagId);
  			}

  			var url = LINE_API_URL+"/user/"+$scope.currentUser.id;
  			$http({
  				url: url,
  				method: "PUT",
  				dataType: "json",
  				data: {"user_tag": $scope.currentUser.user_tag}
  			}).
  			success(function(data, status, headers, config) {
  				//$scope.getLineUserList(); 
  			}).
  			error(function(data, status, headers, config) {

  			});  

	    }else{

	    	$http({
            url: LINE_API_URL+"/user_tag",
            method: "POST",
            dataType: "json",
            data: {"productID": 1,"tagName": tagText}
        }).
        success(function(data, status, headers, config) {
    		
  				if($scope.currentUser.user_tag.indexOf(data.id)!=-1){
    				return;
    			}else{
    				$scope.currentUser.user_tag.push(data.id);
    			}

  				var url = LINE_API_URL+"/user/"+$scope.currentUser.id;
  				$http({
  					url: url,
  					method: "PUT",
  					dataType: "json",
  					data: {"user_tag": $scope.currentUser.user_tag}
  				}).
  				success(function(data, status, headers, config) {
  					$scope.getLineUserList(); 
  				}).
  				error(function(data, status, headers, config) {

  				});  

        }).
        error(function(data, status, headers, config) {
            
        });
	    }
  	}else if(selectedTag != "" && selectedTag != undefined){

  		if($scope.currentUser.user_tag.indexOf(selectedTag)!=-1){
  			return;
  		}else{
  			$scope.currentUser.user_tag.push(selectedTag);
  		}

  		var url = LINE_API_URL+"/user/"+$scope.currentUser.id;
  		$http({
  			url: url,
  			method: "PUT",
  			dataType: "json",
  			data: {"user_tag": $scope.currentUser.user_tag }
  		}).
  		success(function(data, status, headers, config) {
  			//$scope.getLineUserList(); 
  		}).
  		error(function(data, status, headers, config) {

  		});  

  	}
  
  };

  $scope.removeTag = function(){
  	var tagToRemove = parseInt($scope.currentTagToRemove[$scope.currentUser.id]);
  	var removeIndex = $scope.currentUser.user_tag.indexOf(tagToRemove);
  	$scope.currentUser.user_tag.splice(removeIndex, 1);

  	$scope.currnentIndex = -1;
  	var url = LINE_API_URL+"/user/"+$scope.currentUser.id;
  	$http({
  		url: url,
  		method: "PUT",
  		dataType: "json",
  		data: {"user_tag": $scope.currentUser.user_tag }
  	}).
  	success(function(data, status, headers, config) {
  		$scope.getLineUserList(); 
  	}).
  	error(function(data, status, headers, config) {

  	});  

  };

  $scope.getTagName = function(tagId){
  	for(var i in $scope.userTag){
  		if($scope.userTag[i].id == tagId){
  			return $scope.userTag[i].name;
  		}
  	}
  	return null;
  };

  $scope.getTagId = function(tagName){
  	for(var i in $scope.userTag){
  		if($scope.userTag[i].name == tagName){
  			return $scope.userTag[i].id;
  		}
  	}
  	return null;
  };

  $scope.filterUser = function(item) {
    if(item.loyalty>=$scope.minLoyalty){
    	if($scope.serchQuery.type == "tag" && $scope.serchQuery.queryTag != ""){
    		var tagId = $scope.getTagId($scope.serchQuery.queryTag); //タグIDを取得する
    		if(tagId){
    	 		return item.user_tag.indexOf(tagId) != -1; //タグIDが初めに現れたインデックス番号を取得する
    		}else{
    			return false;
    		}
    	}else if($scope.serchQuery.type == "text" && $scope.serchQuery.queryText != ""){
        return item.name.indexOf($scope.serchQuery.queryText)!=-1;         
      }
    	return true;
    }else{
      return false
    }
};

	$scope.searchByTag = function(tagId){
		$scope.serchQuery.type = "tag";
		$scope.serchQuery.queryTag = $scope.getTagName(tagId);
	};

  $scope.searchByText = function(){
    $scope.serchQuery.type = "text";
    $scope.serchQuery.queryText = $scope.userNameText;
  };

  $scope.minLoyaltyUpdate = function(){
    $scope.minLoyalty = parseInt($scope.loyaltyStr);
  }

  $scope.getUserMessages = function(user){

    var url = LINE_API_URL+"/user/"+user.id+"/message";
    $http({
      url: url,
      method: "GET",
      dataType: "json",
    }).
    success(function(data, status, headers, config) {
      for(var i in data){
        data[i]['datetime'] = timeConverter(data[i]['created_date']);
      }

      $scope.userMessages = data;
      $scope.currentUser = user;
      $scope.showMessage = true;
      $scope.messageSent = false;
    }).
    error(function(data, status, headers, config) {

    });  
  };

  $scope.closeMessageWindow = function(){
    $scope.userMessages = undefined;
    $scope.showMessage = false;
    $scope.messageSent = false;
  };

  $scope.updateProduct = function(){
    $scope.getLineUserList();
  }

  $scope.getLineUserList();


  $scope.submitMessage = function(userId){

    var asignee = $scope.asignee;
    if(!asignee){
      return;
    }

    localStorage.setItem("asignee", $scope.asignee);

    var messageText = $("#text_area_wrapper > #text_area").val();

    if (!messageText || messageText==""){
      return;
    }

    var url = LINE_API_URL+"/response_message";
    $http({
      url: url,
      method: "POST",
      dataType: "json",
      data: {"user": userId, "asignee": asignee, "message": messageText, "productId": $scope.selectedProductId}
    }).
    success(function(data, status, headers, config) {
      $scope.messageSent = true;
      $("#text_area_wrapper > #text_area").val("");

    }).
    error(function(data, status, headers, config) {
      
    });  
    
  }


});

function timeConverter(UNIX_timestamp){

  var a = new Date(UNIX_timestamp);
  var months = ['1','2','3','4','5','6','7','8','9','10','11','12'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = month + '/' + date + ' ' + hour + ':' + min  ;
  return time;
}

function categoryMapper(cat){
  switch (cat){
    case "univ":
      return "大学"
      break;
    case "sex":
      return "性別"
      break;
    case "position":
      return "志望ポジション"
      break;     
    case "preference":
      return "志向性"
      break;       
    case "major_sci":
      return "専攻（理系）"
      break;       
    case "major_art":
      return "専攻（文系）"
      break;     
    case "location":
      return "希望勤務地"
      break;  
    case "industry":
      return "志望業界"
      break;  
    case "grade":
      return "学年"
      break;
    case "intelligence":
      return "所感"
      break;    
    case "operator":
      return "担当者"
      break;      
    default:
      return "その他"
      break;  
  }
}