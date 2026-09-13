import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://yxtlfwyvzwtszwhdboau.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4dGxmd3l2end0c3p3aGRib2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMDIwMDAsImV4cCI6MjEwNDc3ODAwMH0.hzZHypoCB5gRyH2xs-Z1_62JbFA7JfD3-nF1G1pGWXw'
)

const BOT_TOKEN = '8936712591:AAHNn_trDtuu-Hc5DjFGb8HElmcUlAkvSys'

async function sendTelegramMessage(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

export default async function handler(req: Request) {
  const now = new Date()

  // Получаем все объекты
  const { data: outlets } = await supabase
    .from('outlets')
    .select('*')

  // Получаем все инспекции (последние по каждому объекту)
  const { data: inspections } = await supabase
    .from('inspections')
    .select('outlet_id, created_at')
    .order('created_at', { ascending: false })

  // Получаем всех инспекторов с telegram_id
  const { data: inspectors } = await supabase
    .from('inspectors')
    .select('*')

  if (!outlets || !inspections || !inspectors) {
    return new Response('Error loading data', { status: 500 })
  }

  // Находим последнюю проверку для каждого объекта
  const lastInspectionByOutlet: Record<number, string> = {}
  inspections.forEach((ins: any) => {
    if (!lastInspectionByOutlet[ins.outlet_id]) {
      lastInspectionByOutlet[ins.outlet_id] = ins.created_at
    }
  })

  // Находим просроченные объекты
  const overdue: any[] = []
  const dueSoon: any[] = []

  outlets.forEach((outlet: any) => {
    const lastDate = lastInspectionByOutlet[outlet.id]
    if (!lastDate) {
      overdue.push({ outlet, daysSince: 999, daysOverdue: 999 })
      return
    }

    const last = new Date(lastDate)
    const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    const daysOverdue = daysSince - outlet.check_interval_days

    if (daysOverdue > 0) {
      overdue.push({ outlet, daysSince, daysOverdue })
    } else if (daysOverdue >= -3) {
      dueSoon.push({ outlet, daysLeft: Math.abs(daysOverdue) })
    }
  })

  if (overdue.length === 0 && dueSoon.length === 0) {
    return new Response('No notifications needed', { status: 200 })
  }

  // Формируем сообщение
  let message = '🍩 <b>PON\'S | CHECK — Напоминание о проверках</b>\n\n'

  if (overdue.length > 0) {
    message += `🔴 <b>Просрочено (${overdue.length}):</b>\n`
    overdue.slice(0, 10).forEach(({ outlet, daysOverdue }) => {
      const days = daysOverdue === 999 ? 'никогда не проверялась' : `просрочено на ${daysOverdue} дн.`
      message += `• ${outlet.name} — ${outlet.city}\n  ${days}\n`
    })
    if (overdue.length > 10) message += `  ...и ещё ${overdue.length - 10}\n`
    message += '\n'
  }

  if (dueSoon.length > 0) {
    message += `🟡 <b>Скоро (${dueSoon.length}):</b>\n`
    dueSoon.forEach(({ outlet, daysLeft }) => {
      message += `• ${outlet.name} — через ${daysLeft} дн.\n`
    })
  }

  message += `\n📱 <a href="https://pons-check.vercel.app">Открыть приложение</a>`

  // Отправляем всем инспекторам
  const sendPromises = inspectors
    .filter((insp: any) => insp.telegram_id && insp.telegram_id.length > 5)
    .map((insp: any) => sendTelegramMessage(insp.telegram_id, message))

  await Promise.all(sendPromises)

  return new Response(`Sent to ${inspectors.length} inspectors`, { status: 200 })
}

export const config = { runtime: 'edge' }
