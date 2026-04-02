import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [restaurant, setRestaurant] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRestaurant(session.user.id, session.user.email)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchRestaurant(session.user.id, session.user.email)
      else setRestaurant(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const [managedId, setManagedId] = useState(() => sessionStorage.getItem('managed_restaurant_id'))

  async function fetchRestaurant(userId, userEmail) {
    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', userId)
      .single()
    if (!data) {
      if (userEmail === 'evan@ecwebco.com') {
        setRestaurant(null)
      } else {
        await supabase.auth.signOut()
        setSession(null)
        setRestaurant(null)
      }
    } else {
      setRestaurant(data)
    }
  }

  async function manageRestaurant(id) {
    if (!id) {
      sessionStorage.removeItem('managed_restaurant_id')
      setManagedId(null)
      return
    }
    sessionStorage.setItem('managed_restaurant_id', id)
    setManagedId(id)
  }

  // If managing a specific restaurant, fetch that one instead
  const [managedRestaurant, setManagedRestaurant] = useState(null)
  useEffect(() => {
    if (managedId) {
      supabase.from('restaurants').select('*').eq('id', managedId).single()
        .then(({ data }) => setManagedRestaurant(data))
    } else {
      setManagedRestaurant(null)
    }
  }, [managedId])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, restaurant: managedRestaurant || restaurant, ownRestaurant: restaurant, managedId, manageRestaurant, signIn, signOut, loading: session === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
