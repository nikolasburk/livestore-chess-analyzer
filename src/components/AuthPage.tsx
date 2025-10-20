import React, { useState } from 'react'

import { LoginPage } from './LoginPage.js'
import { SignupPage } from './SignupPage.js'

interface AuthPageProps {
  onAuthSuccess: (email: string, token: string) => void
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="app">
      {isLogin ? (
        <LoginPage onSwitchToSignup={() => setIsLogin(false)} onAuthSuccess={onAuthSuccess} />
      ) : (
        <SignupPage onSwitchToLogin={() => setIsLogin(true)} onAuthSuccess={onAuthSuccess} />
      )}
    </div>
  )
}
