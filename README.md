# Photo Sharing Project

- Firebase Cloud Functionを使った認証コードログイン
- 更新があったら写真一覧更新
- Promise.allで並列処理で写真一覧ダウンロード
- インスタグラム風に写真一覧を表示
- 写真プレビューモーダル
- アップロードモーダル
- 複数画像アップロード
- アップロード前に画像をExifのorientationを反映しつつ圧縮
- 画像の圧縮も並列処理
- アップロード処理も並列処理
- アップロード後、Cloud Functionで圧縮し、サムネイル用画像を生成し、Firestoreに画像情報登録


# todo


+ [x] 写真アップロードページ実装
+ [x] `listAll`による写真一覧ページ実装
+ [x] TypeScript導入
+ [x] 各ページ統合
+ [x] Firestoreデータに基づく写真一覧ページ実装
+ [x] Cloud Functionでアップロード時に画像情報をFirestoreに記録
+ [x] コード認証確認のためのtokenページを作成
+ [x] Cloud Functionでコード認証を実装
+ [x] ログインページレイアウト実装
+ [x] ログインページ中身実装
+ [x] レイアウトをアップデート
+ [x] ログインページで認証中は入力できないように
+ [x] Cloud Functionで縮小版アップロード機能実装
+ [x] 写真プレビューモーダル実装
+ [x] アップロードページをモーダルに
+ [x] 写真プレビューローディング
+ [x] アップロードローディング
+ [x] cloud function 写真プレビュー用サムネイル→blueimp-load-imageを使って圧縮してアップロード
+ [x] アップロードローディングをバックグラウンドに
+ [x] アップデート終了をポーリングではなく`onSnapshot`に
+ [x] `onSnapshot`で写真更新
+ [x] 複数画像アップロード
+ [ ] 写真プレビューページを複数ページに→
https://firebase.google.com/docs/firestore/query-data/query-cursors#paginate_a_query
+ [x] グループ紹介ページ
+ [ ] セットリスト
+ [x] スライドショー
+ [ ] 初回アクセスのみ使用方法アナウンス

# UploadLayerコンポーネント

## ステート

- modalAppear: モーダルが見えるか
- btnAppear: アップロードボタンが見えるか
- uploading: アップロード中か
- imageUrl: 画像のdata url
- clickable: アップロードボタン押下可能か
- fileName: ファイル名
- blobledImage: 圧縮したblob画像

## 通常時

1. 初期状態
    1. modalAppear:false
    1. btnAppear:true
    1. uploading:false
1. アップロードボタンクリック
    1. modalAppearをtrue
    1. btnAppearをfalse
1. 写真選択
    1. imageUrlにblobのdata url
    1. clickableをtrue
1. 写真アップロード
    1. uploadingをtrue
    1. modalAppearをfalse
1. 写真アップロード完了
    1. findFileを待つ
    1. imageUrlを""に
    1. clickableをfalse
    1. uploadingをfalse
    1. btnAppearをtrue

## モーダルキャンセル時

1. 初期状態
    1. modalAppear:false
    1. btnAppear:true
    1. uploading:false
1. アップロードボタンクリック
    1. modalAppearをtrue
    1. btnAppearをfalse
1. モーダル外をタップ
    1. imageUrlを""に
    1. clickableをfalse
    1. modalAppearをfalse
    1. btnAppearをtrue

- UploadLayer
    - Btn
    - UploadModal
        - アップロードセクション
    - UploadStatus

## UploadLayer

- ステート
    - modalAppear: モーダルが見えるか
    - btnAppear: アップロードボタンが見えるか
    - uploading: アップロード中か
- 関数
    - モーダル開く処理
    - モーダル閉じる処理
    - アップロード開始時処理
    - アップロード終了時処理

## UploadModal

- 管理するステート
    - imageUrl: 画像のdata url
    - clickable: アップロードボタン押下可能か
    - fileName: ファイル名
    - blobledImage: 圧縮したblob画像
- 関数
    - 写真選択時処理
    - アップロード処理
    - アップロード完了判定処理
    - ステートをクリアにする処理
- もらうステート
    - modalAppear
- もらう関数
    - モーダル閉じる処理
    - アップロード開始時処理
    - アップロード終了時処理

## アップロード

`uploadTask`


https://firebase.google.com/docs/storage/web/upload-files?hl=ja#monitor_upload_progress  
このドキュメントだけ呼んだだけだと分かりにくいが、uploadTask.onの第1引数に'state_changed'を指定すると、第2、第3、第4引数に渡した関数でアップロード状況を管理することができる。