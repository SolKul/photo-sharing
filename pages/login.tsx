import firebaseApp from "../components/fire"
import { getAuth,Auth} from 'firebase/auth'
import { getFunctions, httpsCallable } from "firebase/functions";

import Layout from '../components/Layout'
import { useRouter } from "next/dist/client/router";

const auth = getAuth(firebaseApp);
const functions = getFunctions(firebaseApp,"asia-northeast1");
// connectFunctionsEmulator(functions, "localhost", 5001);

const requireVerification=async(user: Auth["currentUser"])=>{
  if(user){
    const verifyCode = httpsCallable(functions, "authWithCode");
    try {
      await verifyCode({verifyCode:"1222"})
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
  return <div>
    <Layout header='Photo Sharing' title='Login Page'>
    <div className="container mt-5 mx-2 text-center">
      <div className="row justify-content-center g-1 form-group">
        <label className="h5 form-label" htmlFor="code">コードを入力してください</label>
        <div></div>
        <div className="col-12 col-md-8">
          <input className="col-12 col-md-8 form-control" type="number" id="code"></input>
        </div>
        <div></div>
        <button className="col-12 col-md-8 btn btn-primary">ログイン</button>
      </div>
    </div>
    </Layout>
  </div>
}