import { useRouter } from "next/router";
import React, { useState,useEffect } from "react";

import firebaseApp from "../components/fire"
import { getAuth,signInAnonymously,Auth,onAuthStateChanged} from 'firebase/auth'
import { getFunctions, httpsCallable } from "firebase/functions";

import Layout from '../components/Layout'

const auth = getAuth(firebaseApp);
const functions = getFunctions(firebaseApp,"asia-northeast1");
// connectFunctionsEmulator(functions, "localhost", 5001);

/** cloud functionでコードを認証し、custom claimを付与してもらう処理
 */
const requireVerification=async(user: Auth["currentUser"],code:string)=>{
  if(user){
    const verifyCode = httpsCallable(functions, "authWithCode");
    try {
      await verifyCode({verifyCode:code})
      const idTokenResult = await user.getIdTokenResult(true)
      if (idTokenResult.claims.codeVerified){
        return "code verified!"
      }else{
        throw new Error("can't be authenticated")
      }
    }catch(error){
      console.log(error)
      throw new TypeError("code doesn't match ...")
    }
  }else{
    throw new Error("user is undefined")
  }
}

export default function Home(){
  const [code,setCode] = useState<string>("")
  const [message,setMessage] = useState<string>("")
  const [isVerifying,setIsVerifying]=useState<boolean>(false)
  const router = useRouter()

  // アクセス時に匿名認証
  useEffect(()=>{
    return onAuthStateChanged(auth,(user)=>{    
      if (user == null){
        signInAnonymously(auth)
        .then(()=>{
          console.log("logined: ",auth.currentUser && auth.currentUser.uid)
        })
      }else{
        console.log('already logined: ',user.uid)
      }// end else
    })//end onAuthStat
  },[])

  /**コードを入力したらその値をcodeに保持する処理
   */
  const doChangeCode=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const inputCode=e.target.value
    if (inputCode.length<5){
      setCode(e.target.value)
    }
  }

  /** コードをfunctionに送り、認証する処理
   */
  const doLogin=(e:React.MouseEvent<HTMLElement, MouseEvent>)=>{
    e.preventDefault()
    setIsVerifying(true)
    const user =auth.currentUser
    if (user){
      setMessage("コードを確認しています...")
      requireVerification(user,code)
      .then(
        (result)=>{
          console.log(result)
          setMessage("認証しました")
          user.getIdToken(true).then(()=>{
            router.push("/")
          })
        },
        (error)=>{
          console.log(error.message)
          if (error instanceof TypeError) {
            setMessage("認証コードが間違っています")
            user.getIdToken(true).then(()=>{
              setIsVerifying(false)
              router.push("/login")
            })
          }else{
            setIsVerifying(false)
            router.push("/login")
          }
        }
      )
    }else{
      setIsVerifying(false)
      router.push("/login")
    }
  }

  return <div>
    <style jsx>{`
      .btn-midori{
        background-color:#87b960;
      }

      .footer{
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 50px;
      }
    `}</style>
    <Layout header='T&amp;M Wedding' title='T&amp;M Wedding' href="/login">
    <div className="container mt-5 text-center">
      <form className="form-group">
      <fieldset className="row justify-content-center g-1" disabled={isVerifying}>
        <label className="h5 form-label" htmlFor="code">認証コードを入力してください</label>
        <div></div>
        {/* <div className="form-text text-start col-11">認証コードは4桁です</div>
        <div></div> */}
        <div className="col-11 col-md-6">
          <input className="form-control form-control-lg" type="number" id="code" onChange={doChangeCode} value={code} autoComplete="off" ></input>
        </div>
        <div></div>
        <input type="submit" className="col-11 col-md-6 btn btn-midori text-white" onClick={doLogin} value="ログイン" />
        <div></div>
        <div className="text-start col-11 col-md-6 ">{message}</div>
      </fieldset>
      </form>
    </div>
    </Layout>
  </div>
}