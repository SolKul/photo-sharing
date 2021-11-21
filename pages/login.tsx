import { useRouter } from "next/router";
import { useState,useEffect } from "react";

import firebaseApp from "../components/fire"
import { getAuth,signInAnonymously,Auth} from 'firebase/auth'
import { getFunctions, httpsCallable } from "firebase/functions";

import Layout from '../components/Layout'

const auth = getAuth(firebaseApp);
const functions = getFunctions(firebaseApp,"asia-northeast1");
// connectFunctionsEmulator(functions, "localhost", 5001);

const requireVerification=async(user: Auth["currentUser"],code:string)=>{
  if(user){
    const verifyCode = httpsCallable(functions, "authWithCode");
    try {
      await verifyCode({verifyCode:code})
      const idTokenResult = await user.getIdTokenResult(true)
      if (idTokenResult.claims.codeVerified){
        return "code verified!"
      }else{
        throw "failed ..."
      }
    }catch(error){
      console.log(error)
      throw "failed ..."
    }
  }
}

export default function Home(){
  const [code,setCode] = useState<string>("")
  const [message,setMessage] = useState<string>("wait ...")
  const [authMsg,setAuthMsg]=useState<string>("wait ...")

  useEffect(()=>{
    if (auth.currentUser == null){
      signInAnonymously(auth)
    }else{
      setMessage('logined ' + auth.currentUser.uid)
    } 
  },[])

  const doChangeCode=(e:any)=>{
    const inputCode=e.target.value
    if (inputCode.length<5){
      setCode(e.target.value)
    }
  }

  const doLogin=()=>{
    requireVerification(auth.currentUser,code)
    .then(
      (result)=>{
        result && setAuthMsg(result)
      },
      (error)=>{
        error && setAuthMsg(error)
      }
    )
  }

  return <div>
    <Layout header='Photo Sharing' title='Login Page'>
    <div className="container mt-5 text-center">
      <div className="row justify-content-center g-1 form-group">
        <p className="col-11 text-start">{message}</p>
        <p className="col-11 text-start">{authMsg}</p>
        <label className="h5 form-label" htmlFor="code">認証コードを入力してください</label>
        <div></div>
        {/* <div className="form-text text-start col-11">認証コードは4桁です</div>
        <div></div> */}
        <div className="col-11 col-md-6">
          <input className="form-control form-control-lg" type="number" id="code" onChange={doChangeCode} value={code} ></input>
        </div>
        <div></div>
        <button className="col-11 col-md-6 btn btn-primary" onClick={doLogin}>ログイン</button>
      </div>
    </div>
    </Layout>
  </div>
}