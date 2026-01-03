import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Memanggil tabel 'table_test' yang baru kamu buat
    const { data: result, error } = await supabase
      .from('table_test')
      .select('*')

    if (error) {
      console.error('Error:', error)
    } else {
      setData(result)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>Tes Koneksi Supabase</h1>
      <h3>Daftar ID dari table_test:</h3>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {data.length > 0 ? (
            data.map((item) => (
              <li key={item.id}>
                ID: <strong>{item.id}</strong> - Dibuat pada: {item.created_at}
              </li>
            ))
          ) : (
            <p>Data tidak muncul? Cek pengaturan RLS di Supabase.</p>
          )}
        </ul>
      )}
    </div>
  )
}

export default App