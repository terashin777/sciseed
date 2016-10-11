var LINE_API_URL = 'http://ec2-52-36-83-202.us-west-2.compute.amazonaws.com:9000/api';

angular.module('concierAdminApp',[])

    .directive('onFinishRender', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function () {
                        scope.$emit('init_calPage');
                        //↑scope.$emit('init_calPage');は必ず必要
                    });
                }
            }
        }
    }])
    //↑ページの読み込み完了時に処理を実行するといったやり方ができないためカスタムのディレクティブを用いる。
    //↑ng-repeatが終わった時にinit_calPageを実行する。このディレクティブは属性（restrict: 'A'）として用いる。
    //↑linkでディレクティブの具体的な挙動を決める。
    //↑要素（E）とは、<custom-directive></custom-directive>など。属性（A）とは、<div custom-directive>のcustom-directiveなど
    //↑”$timeout(fn[, delay][, invokeApply]);”delayを設定しなければ、即時関数となる。”$emit”自分を含む上方向（親方向）へのイベント通知イベントと一緒にデータも渡すことができる
    //↑$emitによって、HTML上での親となるスコープ（ng-controllerが設定されたタグで入れ子になっている時のng-controllerを含む親要素）に対して、イベントを通知する。
    //↑$emitによって通知されるイベントは$onメソッドで受け取る。

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

    $scope.search = { univ_level:0, grade:"", preference:"", major_sci:"", major_art:"", industry:"", sex:"", operator:"", status:"", loyalty:"", keyword:"" };
    $scope.selected = { univ_level:0, grade:"", preference:"", major_sci:"", major_art:"", industry:"", sex:"", operator:"", status:"", loyalty:"", keyword:"" };
    $scope.re_tags = {name:false, univ:true, grade:true, preference:true,major:true, industry:true, sex:true, operator:true, status:true, loyalty:true, updated_date:true };

    $scope.len = 50;
    $scope.start = 0;
    $scope.searchedValue = "";
    $scope.numOfPage = "";

    $scope.cur_page = 1;

    $scope.pager_len = 10;
    $scope.pager_start = 0;

    $scope.sortList = [{category: "univ"}, {category: "grade"}, {category: "preference"}, {category: "major"}, {category: "industry"}, {category: "loyalty"}, {category: "updated_date"}];
    $scope.icons = {name:"▼", univ:"▼", grade:"▼", preference:"▼", major:"▼", industry:"▼", loyalty:"▼", updated_date:"▼"};
    $scope.addList = [{category: "univ"}, {category: "grade"}, {category: "preference"}, {category: "major"}, {category: "industry"}, {category:"univ_level"}];
    //↑$scope.lineUserListへの要素の追加の際に、$scope.iconだけで済むかと思ったが、どうやってもうまくいかなかった。
    //↑しかし、コピーして改めて$scope.sortListとして定義したものを使うとなぜかうまくいった。
    //↑$scope.iconのほうが、ソート機能と結びついているのが原因か？
    $scope.sortTag = "";
    $scope.couter = 0;

    $scope.univGroupList = [{group:"東大・京大・東工大", univ_level:10}, {group:"一橋・旧帝・早慶・神大・筑波", univ_level:9}, {group:"関東上位校・ＭＡＲＣＨ", univ_level:8}, {group:"関関同立", univ_level:7}, {group:"日東駒専", univ_level:6}];

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
        $scope.numOfUser = Object.keys($scope.lineUserList).length;
        $scope.numOfAdd = Object.keys($scope.addList).length ;
        for(var p = 0; p< $scope.numOfUser; p++){
            for(var q = 0; q<$scope.numOfAdd; q++){
                if($scope.addList[q]["category"] == "univ_level"){
                    $scope.lineUserList[p][$scope.addList[q]["category"]] = 0;
                }
                else{
                $scope.lineUserList[p][$scope.addList[q]["category"]] = "";
                }
                //↑if文のelseは忘れない。
            }
        }
        //↑ユーザーリストの1人1人にaddlistのタグを追加する。
        $scope.numOfTag = Object.keys($scope.userTag).length;
        for(var user_idx = 0; user_idx < $scope.numOfUser ;user_idx++){
            //↑ユーザー1人1人にソート項目の要素を追加する。
            for(var i = 0; i <  $scope.lineUserList[user_idx].user_tag.length; i++){
            //↑ユーザーのタグの数だけループを回し、ユーザーの持つ1つ1つのタグIDがどんなタグであるかを判定する。
                for(var j = 0; j < $scope.numOfTag; j++){
                //↑タグの数だけループを回し、ユーザーの持つタグIDと一致するIDを持つタグを探す。
                    if($scope.lineUserList[user_idx].user_tag[i] == $scope.userTag[j].id){
                        for(var k = 0; k < $scope.numOfAdd; k++){
                        //↑ソート項目の数だけループを回し、ソート項目の中にあるタグであるかどうか判定する。
                            if($scope.userTag[j].category == "major_art" || $scope.userTag[j].category == "major_sci"){
                                if($scope.userTag[j].name != ""){
                                    $scope.lineUserList[user_idx]["major"] = $scope.userTag[j].name;
                                }
                            }
                            else if($scope.userTag[j].category == $scope.addList[k].category ){
                                if($scope.userTag[j].name != ""){
                                    $scope.lineUserList[user_idx][$scope.addList[k].category] = $scope.userTag[j].name;
                                    //↑インデックス番号からユーザーを指定し、条件と合致した$scope.addListのcategoryと同じキーを持つところに、条件と合致したuserTagを代入している。
                                    if($scope.userTag[j].category == "univ"){
                                        switch ($scope.userTag[j].id){
                                            case 24:
                                            case 26:
                                            case 6:
                                            //↑上から東大、京大、東工大のｉｄ
                                                $scope.lineUserList[user_idx].univ_level = 10;
                                                break;
                                            case 29:
                                            case 40:
                                            case 3:
                                            case 27:
                                            case 4:
                                            case 25:
                                            case 5:
                                            case 11:
                                            case 28:
                                            case 23:
                                            case 180:
                                            //↑上から一橋、早稲田、慶応、阪大、東北大、名大、九大、北大、神戸、筑波（下2つ）のｉｄ
                                                $scope.lineUserList[user_idx].univ_level = 9;
                                                break;
                                            case 126:
                                            case 30:
                                            case 9:
                                            case 103:
                                            case 37:
                                            case 110:
                                            case 35:
                                            case 122:
                                            case 31:
                                            case 39:
                                            case 125:
                                            //↑上から横国、上智、理科大、工学院、電通、明大、青学、立教大学、中央大学、法政大学（下2つ）のｉｄ
                                                $scope.lineUserList[user_idx].univ_level = 8;
                                                break;
                                            case 119:
                                            case 177:
                                            //↑上から関西大学、立命館大学のｉｄ
                                                $scope.lineUserList[user_idx].univ_level = 7;
                                                break;
                                            case 129:
                                            case 179:
                                            //↑上から日大、東洋大のｉｄ
                                                $scope.lineUserList[user_idx].univ_level = 6;
                                                break;
                                            default:
                                                $scope.lineUserList[user_idx].univ_level = 0;
                                                break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }).
        error(function(data, status, headers, config) {
    });
    }).
        error(function(data, status, headers, config) {

    });

    //$scope.add = function(){
        //$scope.numOfUser = Object.keys($scope.lineUserList).length;
        //$scope.numOfAdd = Object.keys($scope.addList).length ;
        //↓配列の追加実験
        //for(var u = 0; u<$scope.testnum; u++){ 
            //for(var t = 0; t<$scope.numicon; t++){ 
                //$scope.test[u][$scope.icon[t]["category"]] = "";
            //}
        //}
        //for(var u = 0; u<$scope.testnum; u++){
            //for(var t = 0; t<$scope.testlistnum; t++){ 
                //$scope.test[u][$scope.testlist[t]["category"]] = "";
            //}
        //}
        //$scope.test[1] = {one: "haru"};
        //$scope.test[2] = {one: "haru"};
        //$scope.test[3] = {};
        //$scope.test[3][$scope.testlist[0]["A"]] = "success";
        //[{}]のようになっている時、{}の中にどちらも変数の'キー：要素'を追加したい時は、'配列[インデックス番号][キー]=要素'とする。
        //[{}]において、{}の外に{}を追加して{}の中に要素を入れたい時は、まず'配列[インデックス番号]={}'として、{}を追加し、その次に'配列[追加した{}のインデックス番号][キー]=要素'で追加する。
        //for(var p = 0; p< $scope.numuser; p++){
            //for(var q = 0; q<$scope.numicon; q++){
               // $scope.lineUserList[p][$scope.icon[q]["category"]] = "";
           // }
        //}
        //for(var p = 0; p< $scope.numOfUser; p++){
            //for(var q = 0; q<$scope.numOfAdd; q++){
                //$scope.lineUserList[p][$scope.addList[q]["category"]] = "";
            //}
        //}
    //};

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

    $scope.searchByTag = function(tag){ //検索するタイプを指定し，serchQuery.queryTagに引数として渡されたタグIDからタグの名前を代入する
        $scope.serchQuery.type = "tag";
        $scope.serchQuery.queryTag = tag;
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
        $scope.search.grade      = $scope.getTagId($scope.selected.grade);
        $scope.search.preference = $scope.getTagId($scope.selected.preference);
        $scope.search.major_art  = $scope.getTagId($scope.selected.major_art);
        $scope.search.major_sci  = $scope.getTagId($scope.selected.major_sci);
        $scope.search.industry   = $scope.getTagId($scope.selected.industry);
        $scope.search.sex        = $scope.getTagId($scope.selected.sex);
        $scope.search.operator   = $scope.getTagId($scope.selected.operator);
        $scope.search.status     = $scope.getTagId($scope.selected.status);
        $scope.search.univ_level        = $scope.selected.univ_level;
        $scope.search.loyalty    = $scope.selected.loyalty;
        $scope.search.keyword        = $scope.selected.keyword;
        $scope.serchQuery.queryTag = "";
        $scope.serchQuery.queryText = "";
    };

    $scope.canselSearch = function() {
        $scope.search.univ_level        = 0;
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

        $scope.selected.univ_level        = 0;
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

    $scope.filterByUnivLevel = function(user) {
       return user.univ_level == $scope.search.univ_level;
    };

    $scope.filterByGrade = function(user) {
        if($scope.search.grade != ""){ //選択されたタグが""（全て表示）でなければ絞り込みを行う．
            return user.user_tag.indexOf($scope.search.grade) != -1; 
            //↑array.indexOf(引数)はarrayに引数を含んでいればそのindex番号を返す．なければ-1を返す．
            //↑-1を返さない。つまり、arrayに引数を含んでいるという条件でfilterをかけている。
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

    //$scope.filterByLoyalty = function(user) {
            //return user.loyalty >= $scope.search.loyalty;
    //};
    //$scope.filterUserで、変更をすぐに反映するなら必要ない。
    
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
            data[i]['datetime'] = timeConverter(data[i]['updated_date']);
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
        $scope.cur_page = page+1;
    };

    $scope.$on('init_calPage', function(len) {
        if ($scope.numOfTry == 0) { 
        $scope.numOfPage = Math.ceil( $scope.searchedValue/$scope.len);
        $scope.numOfTry += 1;
        }
    });
    //↑イベント監視を行う。指定のイベント（ここでは、init_calPage）が発生した際に実行されるリスナーを登録できる。
    //↑pageCalが呼び出されるたびに実行してしまうので、numOfTryを使って読み込みごとに一回だけ実行されるようにしている。

    $scope.calPage = function(len){ 
        $scope.numOfPage = Math.ceil( $scope.searchedValue/$scope.len);
        $scope.numOfTry += 1;
        $scope.start = 0;
        $scope.pager_start = 0;
        $scope.cur_page = 1;
    };

    $scope.$watch('searchedValue', function(newValue, oldValue) {
        $scope.numOfPage = Math.ceil( newValue/$scope.len);
    });
    //↑searchedValueの値が変化するたびにページ数を計算しなおす。
    
    $scope.firstPage =function() {
        $scope.pager_start = 0;
        $scope.start = 0;
    };

    $scope.lastPage =function() {
        if($scope.numOfPage>10){
            $scope.pager_start = $scope.numOfPage - 11;
        }
        else{
            $scope.pager_start = 0;
        }
        $scope.start =  $scope.len * ($scope.numOfPage - 1);
    };

    $scope.arrOfPage = function(n) {
        var arr = [];
        for (var i=0; i<n; ++i) arr.push(i);
        return arr;
    };
    //↑injectorがすべてのモジュールをロード完了時に実行すべき内容を登録。アプリケーションの初期化に使用する。
    //↑$rootScopeはアプリケーション全体で共有される。
    //↑ただの数をng-repeatで繰り返すために、配列を作っている。

    $scope.sort = function(exp, reverse){
        $scope.lineUserList = $filter('orderBy')($scope.lineUserList, exp, reverse);
    };

    $scope.tag_sort = function(exp, reverse){
        //↑booleanの反転は変数の前に"!"をつけて代入する。
        $scope.sort(exp, reverse);
        for(var icon in $scope.icons){
            if(icon != exp){
                $scope.icons[icon] = "▼";
            }
        }
        if(exp == "name"){
            if(reverse){
                $scope.icons[exp] = "▲";
            }
            else{
                $scope.icons[exp]  = "▼";
            }
        }
        else{
            if(reverse){
                $scope.icons[exp] = "▼";
            }
            else{
                $scope.icons[exp]  = "▲";
            }
        }
        $scope.re_tags[exp] = !reverse;
        return $scope.icons[exp];
    };

    $scope.getSortTag = function(ic_cat, tag, item){
        if(item[ic_cat] != ""){
            return item[ic_cat];
        }
        else{
            return "　";
        }
    };
    //↑ソートを行えるようにするために、idとなっているタグをlineUserListの要素として追加する。

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



