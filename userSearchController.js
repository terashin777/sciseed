var LINE_API_URL = 'http://ec2-52-36-83-202.us-west-2.compute.amazonaws.com:9000/api';

angular.module('concierAdminApp',[])
/*
    .directive('onInitCheck', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                $timeout(function () {
                    scope.$emit('InitChange');
                });
            }
        }
    }])
*/

    .directive('onFinishRender', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                if (scope.$last === true) {
                    $timeout(function () {
                        scope.$emit('initCalPage');
                        //↑scope.$emit('initCalPage');は必ず必要
                    });
                }
            }
        }
    }])
    //↑ページの読み込み完了時に処理を実行するといったやり方ができないためカスタムのディレクティブを用いる。
    //↑ng-repeatが終わった時にinitCalPageを実行する。このディレクティブは属性（restrict: 'A'）として用いる。
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

    //↓ページ数の初期化用
     $scope.numOfTry = 0;
     //↑一度しか実行したくないものに用いる

     //↓データ取得場所指定
     $scope.selectedProductId = 1;

     //↓データ格納用
    $scope.lineUserList = [];
    $scope.userTag = [];
    $scope.currnentIndex = -1;

    //↓タグ編集用
    $scope.tag_add = true;

    //↓メッセージ操作用
    $scope.showMessage = false;
    $scope.messageSent = false;

    $scope.currentTagText={};
    $scope.currentSelectedTag={};
    $scope.currentTagToRemove={};

    //↓現在選択中のユーザー
    //↓メッセージ閲覧、タグ編集用
    $scope.currentUser;

    //↓最小やり取り数
    $scope.minLoyalty = 3;
    $scope.loyaltyStr = "3";

    //↓志望業界全表示／非表示判定用
    $scope.industryShow = false;
    $scope.industryShowIcon = "▼"

    //↓絞込み用の変数など
    //full//$scope.search = { univ_level:{}, grade:{}, preference:{}, major:{}, industry:{},operator:{}, status:{}, sex:{}, loyalty:0 , keyword:"", updated_date:"" };
    //full//$scope.selected = { univ_level:{}, grade:{}, preference:{}, major:{}, industry:{}, operator:{}, status:{}, sex:{}, loyalty:0 , keyword:"", updated_date:"" };
    //full//$scope.allFrags = { allUnivLevel:true, allGrade:true, allPreference:true, allMajor:true, allIndustry:true, allOperator:true, allStatus:true, allSex:true }
    $scope.selected = { univ_level:{10:true, 9:true, 8:true, 7:true, 6:true,0:true}, grade:{}, major:{"文系":true}, sex:{}, preference:{}, industry:{}, loyalty:0 , keyword:"", updated_at:"" };
    $scope.search = { univ_level:{}, grade:{}, major:{}, sex:{}, preference:{}, industry:{}, loyalty:0 , keyword:"", updated_at:"" };
    $scope.allFrags = { univ_level:true, grade:true, major:true, sex:true, preference:true, industry:true };
    $scope.nullTagUserFrags = { univ_level:true, grade:true, major:true, sex:true, preference:true, industry:true };
    $scope.all = true;

    //↓ページャー機能用の変数など
    $scope.len = 50;
    $scope.start = 0;
    $scope.searchedValue = "";
    $scope.numOfPage = "";
    $scope.cur_page = 1;
    $scope.pager_len = 10;
    $scope.pager_start = 0;

    //↓テスト用の変数など
    $scope.testTags=[];
    $scope.testItems=[];

    //↓ソート用の変数など
    $scope.sortList = [{category: "univ"}, {category: "grade"}, {category: "major"}, {category: "preference"}, {category: "industry"}];
    $scope.icons = {name:"▼", univ:"▼", grade:"▼", major:"▼", preference:"▼", industry:"▼", loyalty:"▼", updated_at:"▼"};
    $scope.addList = [{category: "univ"}, {category:"univ_level"}, {category: "grade"}, {category: "major"}, {category: "preference"}, {category: "industry"}, {category:"updated_at"}];
    //↑$scope.lineUserListへの要素の追加の際に、$scope.iconだけで済むかと思ったが、どうやってもうまくいかなかった。
    //↑しかし、コピーして改めて$scope.sortListとして定義したものを使うとなぜかうまくいった。
    //↑$scope.iconのほうが、ソート機能と結びついているのが原因か？
    $scope.re_tags = {name:false, univ:true, grade:true,major:true, sex:true, preference:true, industry:true, operator:true, status:true, loyalty:true, updated_at:true };
    $scope.sortTag = "";
    $scope.couter = 0;
    $scope.univGroupList = [{group:"東大・京大・東工大", univ_level:10}, {group:"一橋・旧帝・早慶・神大・筑波", univ_level:9}, {group:"関東上位校・ＭＡＲＣＨ", univ_level:8}, {group:"関関同立", univ_level:7}, {group:"日東駒専", univ_level:6}, {group:"その他", univ_level:0}];

    //↓ページャー機能用の変数など
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
        for(var userIdx=0 ; userIdx<$scope.numOfUser ; userIdx++){
            for(var addIdx=0; addIdx<$scope.numOfAdd ; addIdx++){
                if($scope.addList[addIdx]["category"] === "preference" || $scope.addList[addIdx]["category"] === "industry"){
                    $scope.lineUserList[userIdx][$scope.addList[addIdx]["category"]] = [""];
                }
                else{
                    $scope.lineUserList[userIdx][$scope.addList[addIdx]["category"]] = "";
                }
                //↑if文のelseは忘れない。
            }
            $scope.lineUserList[userIdx]["isArt"] = false;
        }
        //↑ユーザーリストの1人1人にaddlistのタグを追加する（空のプロパティを用意する）。
        //↑view側でソート項目と同じ順番に表示されるようにここでは明示的にループをまわして、順番どおりに配列が作られるようにしている。
        //↑for～inだと順番が変わってしまう恐れがある。
        $scope.numOfTag = Object.keys($scope.userTag).length;
        for(userIdx in $scope.lineUserList){
            //↑ユーザー1人1人にソート項目の要素を追加する。
            $scope.lineUserList[userIdx]['updated_at'] = new Date($scope.lineUserList[userIdx]['updated_date']);
            //↑new Dateしたobjectを用いないとソートできない。
            for(addIdx in $scope.addList){
            //↑加えるソート項目の数だけループを回し、ソート項目の中にあるタグであるかどうか判定する。
                for(tagIdx in $scope.userTag){
                //↑タグリストの中からタグの数だけループを回し、ユーザーの持つタグIDと一致するIDを持つタグを探す。
                    if(!$scope.userTag[tagIdx]["category"]){
                        continue;
                    }
                    //↑userTagのcategoryが空のは、ループの次に進む。
                    else if($scope.userTag[tagIdx]["category"] && $scope.userTag[tagIdx]["category"].indexOf($scope.addList[addIdx]["category"]) === -1){
                    //↑indexOfを用いる時は必ず、文字列があることを確認してから行う。
                    //↑ここでは、$scope.userTag[tagIdx]["category"] && がそれにあたる。
                    //↑addListに含まないcategoryのものは、ユーザーのプロパティに追加しない。
                        continue;
                         //↑タグのcategoryが現在回しているaddlistのcategoryと異なる場合は、以下の処理を実行しない。
                         //↑indexOfを用いているのは、categoryがmajor_artまたはmajor_sciであるものを同じものとみなすため。
                         //↑indexOfを用いれば他のcategoryと区別しなくてよくなるため、majorのときだけ分岐するif文がいらなくなる。
                    }
                    else if($scope.addList[addIdx]["category"] !== "" && $scope.addList[addIdx]["category"].indexOf("univ") === -1){
                            //↓categoryがunivまたはuniv_levelでなければselectedをtrueにする。
                            $scope.selected[$scope.addList[addIdx]['category']][$scope.userTag[tagIdx]['name']]=true;
                    }
                    //↑univ
                    for(userTagIdx in $scope.lineUserList[userIdx].user_tag){
                    //↑ユーザーのタグの数だけループを回し、ユーザーの持つ1つ1つのタグIDがどんなタグであるかを判定する。
                        if($scope.lineUserList[userIdx].user_tag[userTagIdx] == $scope.userTag[tagIdx].id){
                        //↑ユーザーの持つタグとタグリストのタグのidが一致するか判定し、一致すればユーザーのそれに応じたカテゴリーのプロパティに値を代入する。
                            if($scope.userTag[tagIdx].name !== ""){
                                if($scope.addList[addIdx]["category"] === "preference" || $scope.addList[addIdx]["category"] === "industry"){
                                     $scope.lineUserList[userIdx][$scope.addList[addIdx]["category"]].push($scope.userTag[tagIdx].name);
                                }
                                else{
                                    $scope.lineUserList[userIdx][$scope.addList[addIdx]["category"]] = $scope.userTag[tagIdx].name;
                                    //↑userTagのnameが空でなければ、lineUserListのそれぞれのカテゴリーのプロパティに値を代入する。
                                }
                                if($scope.userTag[tagIdx].category === "major_art"){
                                    $scope.lineUserList[userIdx]["isArt"] = true;
                                }
                                if($scope.userTag[tagIdx].category === "univ"){
                                    switch ($scope.userTag[tagIdx].id){
                                        case 24:
                                        case 26:
                                        case 6:
                                        //↑上から東大、京大、東工大のｉｄ
                                            $scope.lineUserList[userIdx].univ_level = 10;
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
                                            $scope.lineUserList[userIdx].univ_level = 9;
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
                                            $scope.lineUserList[userIdx].univ_level = 8;
                                            break;
                                        case 119:
                                        case 177:
                                        //↑上から関西大学、立命館大学のｉｄ
                                            $scope.lineUserList[userIdx].univ_level = 7;
                                            break;
                                        case 129:
                                        case 179:
                                        //↑上から日大、東洋大のｉｄ
                                            $scope.lineUserList[userIdx].univ_level = 6;
                                            break;
                                        default:
                                            $scope.lineUserList[userIdx].univ_level = 0;
                                            break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        for(category in $scope.selected){
            $scope.onChange(category, true);
        }
        $scope.doSearch();
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
    $scope.showIndustryTag = function(){
        $scope.industryShow = !$scope.industryShow;
        if($scope.industryShow){
            $scope.industryShowIcon='▲';
        }
        else{
            $scope.industryShowIcon='▼';
        }
    };

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

    $scope.cancelEditTag = function(){
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
        for(var tagGroup in $scope.selected){
            for(var item in $scope.selected[tagGroup]){
                $scope.search[tagGroup][item] = $scope.selected[tagGroup][item];
            }
        }
        //↑下のようにすると参照渡しになり、searchとselectedが同じものとなってしまうため、上のようにして値渡しにしている。
/*        $scope.search.grade      = $scope.selected.grade;
        $scope.search.preference = $scope.selected.preference;
        $scope.search.major_art  = $scope.selected.major_art;
        $scope.search.major_sci  = $scope.selected.major_sci;
        $scope.search.industry   = $scope.selected.industry;
        $scope.search.sex        = $scope.selected.sex;
        $scope.search.operator   = $scope.selected.operator;
        $scope.search.status     = $scope.selected.status;
        $scope.search.univ_level        = $scope.selected.univ_level;
*/
        $scope.search.keyword        = $scope.selected.keyword;
        $scope.serchQuery.queryTag = "";
        $scope.serchQuery.queryText = "";
    };

    $scope.allCheck = function(all) {
        for(category in $scope.search){
            if(all){
                $scope.allFrags[category] = true;
            }
            else{
                $scope.allFrags[category] = false;
                $scope.selected.loyalty    = "";
                $scope.selected.keyword        = "";
                //絞込みを解除した後、検索を押すと選択されていないのに絞込みが行われるので、selectedも初期化する必要がある。

                $scope.search.loyalty    = "";
                $scope.search.keyword        = "";
                $scope.serchQuery.queryTag = "";
                $scope.serchQuery.queryText = "";

                //document.frm.reset();
            }
            if(category == "sex" || category == "loyalty" || category == "keyword" || category == "updated_at"){
                continue;
            }
                $scope.onChange(category, $scope.allFrags[category]);
        }
        $scope.doSearch();
    }

    $scope.onChange = function(category, allFrag){
         for(idx in $scope.selected[category]){
            if(allFrag){
                $scope.selected[category][idx] = true;
            }
            else{
                $scope.selected[category][idx] = false;
            }
        }
    };

    $scope.filterByTag = function(user){
    //↓フィルターごとではなく、ユーザーごとにフィルターの処理を実行しなくては、動作が遅くなる。
    //↓フィルターごとにタグリストを参照するループ関数が含むことになるため。
        var trueFrag = false;
        for(tagGroup in $scope.search){
            if(tagGroup === "sex" || tagGroup === "loyalty" || tagGroup === "keyword" || tagGroup === "updated_at"){
                continue;
            }
            else if(tagGroup === "major"){
                trueFrag = false;
                if($scope.nullTagUserFrags[tagGroup] && user[tagGroup] === ""){
                    trueFrag = true;
                    continue;
                }
                for(tag in $scope.search[tagGroup]){
                //↑タグ名がtagに入る。
                    if($scope.search[tagGroup][tag]){
                        //↓majorだけは別処理
                            if(tag === "文系"){
                                if(user["isArt"]){
                                    trueFrag = true;
                                    continue;
                                }
                            }
                            else{
                                if(user[tagGroup] == tag){
                                    trueFrag = true;
                                    continue;
                                }
                            }
                        }
                }
                if(!trueFrag){
                    return false;
                }
            }
            else if(tagGroup === "preference" || tagGroup === "industry"){
                trueFrag = false;
                if($scope.nullTagUserFrags[tagGroup] && user[tagGroup][0] === ""){
                    trueFrag = true;
                    continue;
                }
                for(tag in $scope.search[tagGroup]){
                    if($scope.search[tagGroup][tag]){
                        if(user[tagGroup].indexOf(tag) !== -1){
                            trueFrag = true;
                            continue;
                                //↑lineUserListのなか"univ_level"が一致するものでフィルターをかけている。
                                //↑選択されたuniv_levelのどれかと一致しない、かつタグなし含むにチェックが入れられていない時はfalseを返してそのユーザーをはじく。
                                //↑タグの分類ごとにreturn false;が設定されているので、AND検索。
                                //↑どれか一つの分類でfalseが返されたら、そのユーザーをはじく。
                                //↑どの分類でもfalseを返されずに最後まで残ったユーザーに対してのみtrueが返されて、表示される。
                        }
                    }
                }
                if(!trueFrag){
                    return false;
                }
            }
            //↓major以外の処理
            else{
                trueFrag = false;
                if($scope.nullTagUserFrags[tagGroup] && user[tagGroup] === ""){
                    trueFrag = true;
                    continue;
                }
                for(tag in $scope.search[tagGroup]){
                    if($scope.search[tagGroup][tag]){
                        if(user[tagGroup] == tag){
                            trueFrag = true;
                            continue;
                                //↑lineUserListのなか"univ_level"が一致するものでフィルターをかけている。
                                //↑選択されたuniv_levelのどれかと一致しない、かつタグなし含むにチェックが入れられていない時はfalseを返してそのユーザーをはじく。
                                //↑タグの分類ごとにreturn false;が設定されているので、AND検索。
                                //↑どれか一つの分類でfalseが返されたら、そのユーザーをはじく。
                                //↑どの分類でもfalseを返されずに最後まで残ったユーザーに対してのみtrueが返されて、表示される。
                        }
                    }
                }
                if(!trueFrag){
                    return false;
                }
            }
        }
        return true;
    }

    $scope.filterByLoyalty = function(user) {
        return user.loyalty >= $scope.search.loyalty;
    };
    //$scope.filterUserで、変更をすぐに反映するなら必要ない。
    
    $scope.filterByKeyword = function(user) {
         if($scope.search.keyword != ""){
              return $user == $scope.search.keyword; 
        }else{
            return -1;
        }
    };

    $scope.filterByDate = function(user) {
        return user.updated_at >= $scope.search.updated_at;
    };

    $scope.getUserMessages = function(user){
        //↓ユーザーのIDに応じたメッセージを取得
        var url = LINE_API_URL+"/user/"+user.id+"/message";
        $http({
            url: url,
            method: "GET",
            dataType: "json",
        }).
        //↓取得したメッセージがdataに格納される。
        success(function(data, status, headers, config) {
            for(var i in data){
                data[i]['datetime'] = timeConverter(data[i]['updated_date']);
            }
            //↓取得したメッセージをインスタンス変数に格納する
            $scope.userMessages = data;
            //↓選択したユーザーをcurrentUserとする
            $scope.currentUser = user;
            //↓メッセージ閲覧画面を表示
            $scope.showMessage = true;
            //↓メッセージの送信はしない
            $scope.messageSent = false;
        }).
        //↓エラーの時は何もしない
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

    $scope.$on('initCalPage', function(len) {
        if ($scope.numOfTry === 0) { 
            $scope.numOfPage = Math.ceil( $scope.searchedValue/$scope.len);
            $scope.numOfTry += 1;
        }
    });
    //↑イベント監視を行う。指定のイベント（ここでは、initCalPage）が発生した際に実行されるリスナーを登録できる。
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
        $scope.cur_page = 1;
    };

    $scope.lastPage =function() {
        //var pageVol = Math.ceil( numOfPage/10 );
        if($scope.numOfPage>10){
            $scope.pager_start = $scope.numOfPage - 9;
        }
        else{
            $scope.pager_start = 0;
        }
        $scope.start =  $scope.len * ($scope.numOfPage - 1);
        $scope.cur_page = $scope.numOfPage;
    };

    $scope.arrOfPage = function(n) {
        var arr = [];
        for (var i=0; i<n; i++) {
            arr.push(i);
        }
        return arr;
    };
    //↑injectorがすべてのモジュールをロード完了時に実行すべき内容を登録。アプリケーションの初期化に使用する。
    //↑$rootScopeはアプリケーション全体で共有される。
    //↑ただの数をng-repeatで繰り返すために、配列を作っている。

    $scope.runSort = function(exp, reverse){
        $scope.lineUserList = $filter('orderBy')($scope.lineUserList, exp, reverse);
    };

    $scope.tagSort = function(exp, reverse){
        //↑booleanの反転は変数の前に"!"をつけて代入する。
        $scope.runSort(exp, reverse);
        for(var icon in $scope.icons){
            if(icon != exp){
                $scope.icons[icon] = "▼";
            }
        }
        if(exp === "name"){
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
        if(item[ic_cat] !== ""){
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
        var time = year + '/' + month + '/' + date + ' ' + hour + ':' + min  ;
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



