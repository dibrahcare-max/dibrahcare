const items = ['رعاية الأطفال','مرافقة المستشفى','كبار السن','باقات مرنة','كوادر وطنية','أمان وثقة']

export default function Marquee() {
  const doubled = [...items, ...items]
  return (
    <div style={{ background: 'var(--gold)', padding: '13px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
      <div className="mq-inner" style={{ display: 'inline-flex', gap: 48 }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: '#777C6D' }}>
            {item}
            {i < doubled.length - 1 && <span style={{ color: 'rgba(119,124,109,.4)', marginRight: 48 }}>✦</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
