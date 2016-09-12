var LINE_API_URL = 'http://ec2-52-36-83-202.us-west-2.compute.amazonaws.com:9000/api';
angular.module('concierAdminApp',[])
    .controller('UserSearchCtrl',['$scope','$http',function($scope,$http){

    $scope.serchQuery = {
        "type": "tag",
        "queryTag": "",
        "queryText": "" 
    };
    
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
    $scope.user_univ = {name:""};
    //$scope.user_univ = "";
    $scope.search = { univ:"", grade:"", preference:"", major_sci:"", 
    major_art:"", industry:"", sex:"", operator:"", status:"", loyalty:"", keyword:"" };
    $scope.selected = { univ:"", grade:"", preference:"", major_sci:"", 
    major_art:"", industry:"", sex:"", operator:"", status:"", loyalty:"", keyword:"" };
    $scope.num = 3;
    $scope.begin = 0;
    $scope.selectedProductId = 1;

    $scope.currentUser;

    $scope.show_edit_tag;

    $scope.asignee = localStorage.getItem("asignee");
        
    $http({
        url: 'tag_list.json',
        method:"GET",
        datatype:"json"
    }).
    success(function(d, status, headers, config) {

    for(var tIdx in d){
        d[tIdx].categoryText = categoryMapper(d[tIdx].category);  //ユーザータグリストの中のcategoryを引数として渡し，それをswichで場合わけして，実際に表示する文字列に直している．
    }

    $scope.userTag = d; //ここにユーザータグが入る

    $http({
        url: 'user_list.json',
        method: "GET",
        dataType: "json"
    }).
        success(function(data, status, headers, config) {
        $scope.lineUserList = data; //ここにユーザーリストが入る
    }).
        error(function(data, status, headers, config) {
    });
    }).
        error(function(data, status, headers, config) {

    });

    $scope.openTagAddField = function(user){
        $scope.show_edit_tag = true;
        $scope.currentUser = user;
        $scope.tag_add = true;

    };

    $scope.openTagRemoveField = function(user){
        $scope.show_edit_tag = true;
        $scope.currentUser = user;
        $scope.tag_add = false;
    };

    $scope.canselEditTag = function(){
        $scope.show_edit_tag = false;
        $scope.show_edit_tag = true;
        $scope.currentUser = "";
    };

    $scope.getTagName = function(tagId){
        for(var i in $scope.userTag){ //全タグリストをループし，引数として渡されたタグIDと一致するタグの名前を探す．
            if($scope.userTag[i].id == tagId){
                return $scope.userTag[i].name;
            }
        }
            return "";
    };

    $scope.getTagId = function(tagName){
        for(var i in $scope.userTag){ //全タグリストをループし，引数として渡されたタグ名と一致するタグIDを探す．
            if($scope.userTag[i].name == tagName){
                return $scope.userTag[i].id;
            }
        }
        return ""; /*絞り込みで、全て表示を実装するには、ここはnullではなく、””でなくてはならない。下のフィルタの、if($scope.search.univ != "")での""と対応している。
        両方ともnullにするという手も考えられるが、初期値が””なのでうまくいかない。初めの変数宣言で初期値をnullにすればnullでも問題ない。*/
      };

    $scope.filterUser = function(item) {
        if(item.loyalty>=$scope.minLoyalty){
            if($scope.serchQuery.type == "tag" && $scope.serchQuery.queryTag != ""){
                var tagId = $scope.getTagId($scope.serchQuery.queryTag); //タグIDを取得する
                if(tagId){
                  return item.user_tag.indexOf(tagId) != -1; //タグIDが初めに現れたインデックス番号を取得する indexOfは検索したもの（ここではtagId）がなければ-1を返す
                }else{
                  return -1;
                }
            }else if($scope.serchQuery.type == "text" && $scope.serchQuery.queryText != ""){
                return item.name.indexOf($scope.serchQuery.queryText)!=-1;
            }
            return true;
        }else{
          return -1;
        }
    };

    $scope.searchByTag = function(tagId){ //検索するタイプを指定し，serchQuery.queryTagに引数として渡されたタグIDからタグの名前を代入する
        $scope.serchQuery.type = "tag";
        $scope.serchQuery.queryTag = $scope.getTagName(tagId);
    };

    $scope.searchByText = function(){
        $scope.serchQuery.type = "text";
        $scope.serchQuery.queryText = $scope.userNameText;
    };

    $scope.minLoyaltyUpdate = function(){
        $scope.minLoyalty = parseInt($scope.loyaltyStr);
    };

    $scope.doSearch = function() {
        /*if($scope.user_univ.name == ""){
            $scope.search.user_univ = "";
            //$scope.search.user_univ = $scope.user_univ;
        }else{
            $scope.search.user_univ = $scope.user_univ.name;
            //$scope.search.user_univ = $scope.user_univ;
        }*/
        $scope.search.univ        = $scope.getTagId($scope.selected.univ);
        $scope.search.grade      = $scope.getTagId($scope.selected.grade);
        $scope.search.preference = $scope.getTagId($scope.selected.preference);
        $scope.search.major_art  = $scope.getTagId($scope.selected.major_art);
        $scope.search.major_sci  = $scope.getTagId($scope.selected.major_sci);
        $scope.search.industry   = $scope.getTagId($scope.selected.industry);
        $scope.search.sex        = $scope.getTagId($scope.selected.sex);
        $scope.search.operator   = $scope.getTagId($scope.selected.operator);
        $scope.search.status     = $scope.getTagId($scope.selected.status);
        $scope.search.loyalty    = $scope.selected.loyalty;
        $scope.search.keyword        = $scope.selected.keyword;
        $scope.serchQuery.queryTag != "";
        $scope.serchQuery.queryText != "";
    };

    $scope.canselSearch = function() {
        /*if($scope.user_univ.name == ""){
            $scope.search.user_univ = "";
            //$scope.search.user_univ = $scope.user_univ;
        }else{
            $scope.search.user_univ = $scope.user_univ.name;
            //$scope.search.user_univ = $scope.user_univ;
        }*/
        $scope.search.univ        = "";
        $scope.search.grade      = "";
        $scope.search.preference = "";
        $scope.search.major_art  = "";
        $scope.search.major_sci  = "";
        $scope.search.industry   = "";
        $scope.search.sex        = "";
        $scope.search.operator   = "";
        $scope.search.status     = "";
        $scope.search.loyalty    = "";
         $scope.search.keyword        = "";
    };

    $scope.filterByUniv = function(user) {
        if($scope.search.univ != ""){ //選択されたタグが""（全て表示）でなければ絞り込みを行う．
            return user.user_tag.indexOf($scope.search.univ) != -1; //array.indexOf(引数)はarrayに引数を含んでいればそのindex番号を返す．なければ-1を返す．
        }else{
            return -1; //filterを無効にしたいときは，戻り値に-1を指定すればよい。全て表示で用いる．
        }
    };

    $scope.filterByGrade = function(user) {
        if($scope.search.grade != ""){ //選択されたタグが""（全て表示）でなければ絞り込みを行う．
            return user.user_tag.indexOf($scope.search.grade) != -1; //array.indexOf(引数)はarrayに引数を含んでいればそのindex番号を返す．なければ-1を返す．
        }else{
            return -1; //filterを無効にしたいときは，戻り値に-1を指定すればよい。全て表示で用いる．
        }
    };

    $scope.filterByPreference = function(user) {
        if($scope.search.preference != ""){ //選択されたタグが""（全て表示）でなければ絞り込みを行う．
            return user.user_tag.indexOf($scope.search.preference) != -1; //array.indexOf(引数)はarrayに引数を含んでいればそのindex番号を返す．なければ-1を返す．
        }else{
            return -1; //filterを無効にしたいときは，戻り値に-1を指定すればよい。全て表示で用いる．
        }
    };

    $scope.filterByMajorArt = function(user) {
        if($scope.search.major_art != ""){ //選択されたタグが""（全て表示）でなければ絞り込みを行う．
            return user.user_tag.indexOf($scope.search.major_art) != -1; //array.indexOf(引数)はarrayに引数を含んでいればそのindex番号を返す．なければ-1を返す．
        }else{
            return -1; //filterを無効にしたいときは，戻り値に-1を指定すればよい。全て表示で用いる．
        }
    };

    $scope.filterByMajorSci = function(user) {
        if($scope.search.major_sci != ""){ //選択されたタグが""（全て表示）でなければ絞り込みを行う．
            return user.user_tag.indexOf($scope.search.major_sci) != -1; //array.indexOf(引数)はarrayに引数を含んでいればそのindex番号を返す．なければ-1を返す．
        }else{
            return -1; //filterを無効にしたいときは，戻り値に-1を指定すればよい。全て表示で用いる．
        }
    };

    $scope.filterByIndustry = function(user) {
        if($scope.search.industry != ""){ //選択されたタグが""（全て表示）でなければ絞り込みを行う．
            return user.user_tag.indexOf($scope.search.industry) != -1; //array.indexOf(引数)はarrayに引数を含んでいればそのindex番号を返す．なければ-1を返す．
        }else{
            return -1; //filterを無効にしたいときは，戻り値に-1を指定すればよい。全て表示で用いる．
        }
    };

    $scope.filterBySex = function(user) {
        if($scope.search.sex != ""){ //選択されたタグが""（全て表示）でなければ絞り込みを行う．
            return user.user_tag.indexOf($scope.search.sex) != -1; //array.indexOf(引数)はarrayに引数を含んでいればそのindex番号を返す．なければ-1を返す．
        }else{
            return -1; //filterを無効にしたいときは，戻り値に-1を指定すればよい。全て表示で用いる．
        }
    };

    $scope.filterByOperator = function(user) {
        if($scope.search.operator != ""){ //選択されたタグが""（全て表示）でなければ絞り込みを行う．
            return user.user_tag.indexOf($scope.search.operator) != -1; //array.indexOf(引数)はarrayに引数を含んでいればそのindex番号を返す．なければ-1を返す．
        }else{
            return -1; //filterを無効にしたいときは，戻り値に-1を指定すればよい。全て表示で用いる．
        }
    };

    $scope.filterByStatus = function(user) {
        if($scope.search.status != ""){ //選択されたタグが""（全て表示）でなければ絞り込みを行う．
            return user.user_tag.indexOf($scope.search.status) != -1; //array.indexOf(引数)はarrayに引数を含んでいればそのindex番号を返す．なければ-1を返す．
        }else{
            return -1; //filterを無効にしたいときは，戻り値に-1を指定すればよい。全て表示で用いる．
        }
    };

    $scope.filterByLoyalty = function(user) {
            return user.loyalty >= $scope.search.loyalty;
    };

    $scope.filterByKeyword = function(user) {
         if($scope.search.status != ""){ //選択されたタグが""（全て表示）でなければ絞り込みを行う．
              return $user == $scope.search.keyword; //array.indexOf(引数)はarrayに引数を含んでいればそのindex番号を返す．なければ-1を返す．
        }else{
            return -1; //filterを無効にしたいときは，戻り値に-1を指定すればよい。全て表示で用いる．
        }
    };

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
        $scope.getLineUserList();
    };


    $scope.submitMessage = function(userId){

    var asignee = $scope.asignee;
    if(!asignee){   //asigneeが空であれば，何もせずに戻る
      return;
    }

    localStorage.setItem("asignee", $scope.asignee);    //localStrageにキーがasignee，要素が$scope.asigneeの配列を保存する．

    var messageText = $("#text_area_wrapper > #text_area").val();   //text_area_wrapperというidを持つタグの中のtext_areaというidを持つタグのvalueを取ってくる．

    if (!messageText || messageText=="") {   //messageTextがからであれば，何もせずに戻る．
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
      $("#text_area_wrapper > #text_area").val("");   //valueを空にしている．

    }).
    error(function(data, status, headers, config) {
      
    });

    };

    $scope.displayedResult = function(display, limit) {
        return result = Math.floor(display/limit) + 1;
    };

    $scope.onpaging = function(page){ 
            $scope.begin = $scope.num * page;
    };

}]);

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
    };

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
    };



