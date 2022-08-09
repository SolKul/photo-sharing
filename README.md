# Photo Sharing Project

- Firebase Cloud Functionを使った認証コードログイン
- ~~更新があったら写真一覧更新~~
- Promise.allで並列処理で写真一覧ダウンロード
- インスタグラム風に写真一覧を表示
- 写真プレビューモーダル
- アップロードモーダル
- 複数画像アップロード
- アップロード前に画像をExifのorientationを反映しつつ圧縮
- 画像の圧縮も並列処理
- アップロード処理も並列処理
- アップロード後、Cloud Functionで圧縮し、サムネイル用画像を生成し、Firestoreに画像情報登録
- グループ紹介ページ

# 開発環境

Windowsの場合、以下を参考にsshエージェントを設定する  
https://qiita.com/SolKul/items/3103fdde94c09b044a3a


次にDockerでnodeのimageをpullして、次のようにコンテナを起動

```shell-session
# docker --name photo-sharing -it node /bin/bash
```

VS CodeのRemote Containerでコンテナに入り、`mkdir`で`/home/node/work/`を作成する。そしてそこをワークスペースとしてVS Codeの`Open Folder`で再度開く。

sshエージェントが正しく設定できていれば、次でgithubへの接続の確認とgithubの公開鍵の登録(=接続先として登録)ができる。
```shell-session
# ssh -T git@github.com
```

このリポジトリをクローンする。

npmパッケージが古くなっていないかと、古くなっていた場合のアップデートを次の記事を参考に行う。

[npmパッケージのvulnerability対応フロー](https://qiita.com/riversun/items/7f1679509f38b1ae8adb)

パッケージがインストールできれば、次のコマンドで開発環境のwebアプリが立ち上がる

```shell-session
# npm run dev
```

React/Nextは基本的にクライアントサイドで動くものなので、クライアントサイドのデバッグ環境を整えれば、ブラウザ経由の操作に対応してブレークポイントでデバッグすることができる。


基本的に`.vscode/launch.json`を次のようにすれば`npm run dev`した後に`F5`を押すとブラウザが立ち上がり、デバッグできる。

```launchjson
"configurations": [
  {
    "name": "Launch Chrome",
    "request": "launch",
    "type": "chrome",
    "url": "http://localhost:3000",
    "webRoot": "${workspaceFolder}/photo-sharing",
    "sourceMaps": true,
    "sourceMapPathOverrides": {
        "webpack://_N_E/./*": "${workspaceFolder}/photo-sharing/*"
    }
  }
]
```

launch.jsonについて
- webRootをソースがあるworkspaceFolder以下の適切なディレクトリに設定する
- sourceMapPathOverridesで「ブラウザ(http?)越しに見えるソース配置とVSCode上のソース配置を対応付ける。そのとき最後のアスタリスクをどちらにもつける
- chromeの開発者モードのSourceからwebpackの名前を確認する。
- Next.jsの場合、webpackはwebpack://_N_E/
- 上でwebrRootを適切に設定していれば、${webRoot}は${workspaceFolder}/my-appなどのエイリアスになってくれている。
- 設定を反映するには一回デバック終了して再実行


firebase emulatorを使う場合は、次をクローン。このリポジトリはcloud functionのリポジトリだが、firebase emulatorも一緒になっている。

https://github.com/SolKul/function-storage

次を参考に必要パッケージを整える。(ここら辺はよくわかっていない。)

https://firebase.google.com/docs/emulator-suite





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
+ [x] ~~アップデート終了をポーリングではなく`onSnapshot`に~~
+ [x] ~~`onSnapshot`で写真更新~~
+ [x] 複数画像アップロード
+ [x] 写真プレビューページを複数ページに→
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