var LINE_API_URL = 'http://ec2-52-36-83-202.us-west-2.compute.amazonaws.com:9000/api';

angular.module('concierAdminApp',[])

    .run(function($rootScope) {
        $rootScope.arrOfPage = function(n) {
            var arr = [];
            for (var i=0; i<n; ++i) arr.push(i);
            return arr;
        };
    })
    //↑injectorがすべてのモジュールをロード完了時に実行すべき内容を登録。アプリケーションの初期化に使用する。
    //↑$rootScopeはアプリケーション全体で共有される。
    //↑ただの数をng-repeatで繰り返すために、配列を作っている。
    
    .run(function($rootScope) {
        $rootScope.arrOfProperty = function(n) {
            var arr = [];
            for (var i=0; i<n; ++i) arr.push(i);
            return arr;
        };
    })
    
    .directive('onFinishRender', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function () {
                        scope.$emit('init_pagerCal');
                        //↑scope.$emit('pagerCal');は必ず必要
                    });
                }
            }
        }
    }])
    //↑ページの読み込み完了時に処理を実行するといったやり方ができないためカスタムのディレクティブを用いる。
    //↑ng-repeatが終わった時にpagerCalを実行する。このディレクティブは属性（restrict: 'A'）として用いる。
    //↑linkでディレクティブの具体的な挙動を決める。
    //↑要素（E）とは、<custom-directive></custom-directive>など。属性（A）とは、<div custom-directive>のcustom-directiveなど
    //↑”$timeout(fn[, delay][, invokeApply]);”delayを設定しなければ、即時関数となる。”$emit”自分を含む上方向（親方向）へのイベント通知イベントと一緒にデータも渡すことができる
    //↑$emitによって、HTML上での親となるスコープ（ng-controllerが設定されたタグで入れ子になっている時のng-controllerを含む親要素）に対して、イベントを通知する。
    //↑$emitによって通知されるイベントは$onメソッドで受け取る。
    //
    .directive('tagSort', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function () {
                        scope.$emit('sortTag');
                        //↑scope.$emit('pagerCal');は必ず必要
                    });
                }
            }
        }
    }])

    .controller('UserSearchCtrl',['$scope','$http','$filter',function($scope,$http,$filter){ 
    $scope.serchQuery = {
        "type": "tag",
        "queryTag": "",
        "queryText": "" 
    };
     $scope.numOfTry = 0;

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

    $scope.len = 50;
    $scope.start = 0;
    $scope.searchedValue = "";
    $scope.numOfPage = "";

    $scope.icon = [{category: "name", name:"▼"}, {category: "univ", univ:"▼"}, {category: "grade", grade:"▼"}, {category: "preference", preference:"▼"}, {category: "major_sci", major_sci:"▼"}, {category: "major_art", major_art:"▼"}, {category: "industry", industry:"▼"}, {category: "loyalty", loyalty:"▼"}, {category: "created_date", created_date:"▼"}];
    $scope.numOfProperty =  Object.keys($scope.icon).length;
    $scope.sortTag = "";

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
        if(item.loyalty>=$scope.selected.loyalty){
            if($scope.serchQuery.type == "tag" && $scope.serchQuery.queryTag != ""){
                var tagId = $scope.getTagId($scope.serchQuery.queryTag); //タグIDを取得する
                if(tagId){
                  return item.user_tag.indexOf(tagId) != -1; //タグIDが初めに現れたインデックス番号を取得する indexOfは検索したもの（ここではtagId）がなければ-1を返す
                }else{
                  return -1;
                }
                return true;
            }else{
                return -1;
            }
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
        $scope.serchQuery.queryTag = "";
        $scope.serchQuery.queryText = "";
    };

    $scope.canselSearch = function() {
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
        $scope.serchQuery.queryTag = "";
        $scope.serchQuery.queryText = "";

        $scope.selected.univ        = "";
        $scope.selected.grade      = "";
        $scope.selected.preference = "";
        $scope.selected.major_art  = "";
        $scope.selected.major_sci  = "";
        $scope.selected.industry   = "";
        $scope.selected.sex        = "";
        $scope.selected.operator   = "";
        $scope.selected.status     = "";
        $scope.selected.loyalty    = "";
        $scope.selected.keyword        = "";
        //絞込みを解除した後、検索を押すと選択されていないのに絞込みが行われるので、selectedも初期化する必要がある。

        document.frm.reset();
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
         if($scope.search.keyword != ""){
              return $user == $scope.search.keyword; 
        }else{
            return -1;
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

     $scope.pager = function(page){ 
            $scope.start = $scope.len * page;
    };

    $scope.$on('init_pagerCal', function(len) {
        if ($scope.numOfTry == 0) { 
        $scope.numOfPage = Math.ceil( $scope.searchedValue/$scope.len);
        $scope.numOfTry += 1;
        }
    });
    //↑イベント監視を行う。指定のイベント（ここでは、pagerCal）が発生した際に実行されるリスナーを登録できる。
    //↑pageCalが呼び出されるたびに実行してしまうので、numOfTryを使って読み込みごとに一回だけ実行されるようにしている。

    $scope.pagerCal = function(len){ 
        $scope.numOfPage = Math.ceil( $scope.searchedValue/$scope.len);
        $scope.numOfTry += 1;
    };

    $scope.$watch('searchedValue', function(newValue, oldValue) {
        $scope.numOfPage = Math.ceil( newValue/$scope.len);
    });
    //↑searchedValueの値が変化するたびにページ数を計算しなおす。
    
    $scope.univSort = function(univ){
        var univs = { '東大':6 , '京大':5 , '阪大':4 , '東工大':3 , '一橋大':3 , '東北大':2 , '名大':2 , '早稲田大':1, '慶応大':1 };
        return univs[univ.name];
    };

    $scope.sort = function(exp, reverse){
        if(reverse){
            $scope.icon[exp] = "▲";
        }
        else{
            $scope.icon[exp] = "▼";
        }
    $scope.lineUserList = $filter('orderBy')($scope.lineUserList, exp, reverse);
    };

    $scope.getSortTag = function(ic, tagid){
        for(var i in $scope.userTag){
             if($scope.userTag[i].id == tagid && $scope.userTag[i].category == ic){
                if($scope.sortTag != ""){
                    return $scope.userTag[i].name;
                }
                else{
                    return $scope.userTag[i].name = "　";
                }
            }
        }
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



