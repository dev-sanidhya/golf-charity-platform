'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trophy, Eye, EyeOff, Loader2, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Charity {
  id: string
  name: string
  category: string | null
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: account, 2: charity, 3: plan
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    charityId: '',
    charityPercentage: 10,
    plan: 'monthly',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [charities, setCharities] = useState<Charity[]>([])

  useEffect(() => {
    supabase
      .from('charities')
      .select('id, name, category')
      .eq('is_active', true)
      .then(({ data }) => setCharities(data || []))
  }, [])

  const update = (field: string, value: string | number) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSignup = async () => {
    setError('')
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      })
      if (authError) throw authError
      if (!data.user) throw new Error('Signup failed')

      // Update profile with charity and percentage
      if (formData.charityId) {
        await supabase
          .from('profiles')
          .update({
            charity_id: formData.charityId,
            charity_percentage: formData.charityPercentage,
          })
          .eq('id', data.user.id)
      }

      // Redirect to pricing
      router.push(`/pricing?plan=${formData.plan}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.password) {
        setError('Please fill in all fields')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
    }
    setError('')
    setStep((s) => s + 1)
  }

  return (
    <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Trophy size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl text-white">GolfGives</span>
        </Link>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                s === step ? 'bg-emerald-500 text-white' :
                s < step ? 'bg-emerald-500/30 text-emerald-400' :
                'bg-slate-700 text-slate-500'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-emerald-500/50' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <div className="card-dark p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold mb-2">Create your account</h1>
              <p className="text-slate-400 text-sm mb-8">Join thousands of golfers making a difference</p>

              <div className="space-y-4">
                <div>
                  <label className="label-dark">Full name</label>
                  <input type="text" value={formData.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="John Smith" className="input-dark" />
                </div>
                <div>
                  <label className="label-dark">Email address</label>
                  <input type="email" value={formData.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" className="input-dark" />
                </div>
                <div>
                  <label className="label-dark">Password</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={formData.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••" className="input-dark pr-12" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label-dark">Confirm password</label>
                  <input type="password" value={formData.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="••••••••" className="input-dark" />
                </div>
              </div>

              <button onClick={nextStep} className="btn-primary w-full mt-6">
                Continue to Charity Selection
              </button>
            </div>
          )}

          {/* Step 2: Charity */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold mb-2">Choose your charity</h1>
              <p className="text-slate-400 text-sm mb-6">At least 10% of your subscription supports them</p>

              <div className="grid grid-cols-1 gap-2 mb-6 max-h-64 overflow-y-auto pr-1">
                {charities.map((charity) => (
                  <button
                    key={charity.id}
                    onClick={() => update('charityId', charity.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      formData.charityId === charity.id
                        ? 'border-emerald-500/60 bg-emerald-500/10'
                        : 'border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Heart size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{charity.name}</div>
                      {charity.category && <div className="text-xs text-slate-500">{charity.category}</div>}
                    </div>
                    {formData.charityId === charity.id && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <label className="label-dark">Charity contribution: {formData.charityPercentage}%</label>
                <input
                  type="range"
                  min={10}
                  max={50}
                  value={formData.charityPercentage}
                  onChange={(e) => update('charityPercentage', parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>10% (min)</span>
                  <span>50%</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-outline flex-1">Back</button>
                <button onClick={nextStep} className="btn-primary flex-1">Continue to Plan</button>
              </div>
            </div>
          )}

          {/* Step 3: Plan */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-bold mb-2">Choose your plan</h1>
              <p className="text-slate-400 text-sm mb-6">Cancel anytime. No hidden fees.</p>

              <div className="space-y-3 mb-6">
                {[
                  { id: 'monthly', name: 'Monthly', price: '£19.99/mo', badge: null },
                  { id: 'yearly', name: 'Yearly', price: '£179.99/yr', badge: 'Save 25%' },
                ].map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => update('plan', plan.id)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                      formData.plan === plan.id
                        ? 'border-emerald-500/60 bg-emerald-500/10'
                        : 'border-slate-700/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${formData.plan === plan.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'}`} />
                      <span className="font-medium">{plan.name}</span>
                      {plan.badge && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-white font-semibold">{plan.price}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-outline flex-1">Back</button>
                <button onClick={handleSignup} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <p className="text-center text-sm text-slate-400 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
