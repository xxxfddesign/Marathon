export const GITHUB_BASE = 'https://raw.githubusercontent.com/xxxfddesign/marathon-skills/main/'

export const THEMES = {
  ocean:    { name:'Ocean Blue',    bg:'#081320', nav:'#06121A', card:'#11243B', inputBg:'#0C1E34', primary:'#00C6FF', primaryDk:'#0072FF', accent:'#00E5A8', text:'#FFFFFF', textSec:'#C9D4E5', border:'#1E3C64', badgeBg:'rgba(0,114,255,0.18)', badgeBd:'rgba(0,198,255,0.35)', shadow:'rgba(0,198,255,0.18)' },
  midnight: { name:'Midnight Dark', bg:'#05050A', nav:'#030308', card:'#0F0F1C', inputBg:'#0A0A14', primary:'#9664FF', primaryDk:'#6432DC', accent:'#C896FF', text:'#FFFFFF', textSec:'#B4AAD2', border:'#282341', badgeBg:'rgba(100,50,220,0.18)', badgeBd:'rgba(150,100,255,0.35)', shadow:'rgba(150,100,255,0.18)' },
  forest:   { name:'Forest Green',  bg:'#020A05', nav:'#010602', card:'#071508', inputBg:'#08190E', primary:'#00C864', primaryDk:'#009646', accent:'#64FF96', text:'#FFFFFF', textSec:'#B4DCBE', border:'#194628', badgeBg:'rgba(0,150,70,0.18)', badgeBd:'rgba(0,200,100,0.35)', shadow:'rgba(0,200,100,0.18)' },
  sunset:   { name:'Sunset Run',    bg:'#0A0500', nav:'#080300', card:'#1A0C06', inputBg:'#230F08', primary:'#FF6B35', primaryDk:'#DC3C14', accent:'#FFC400', text:'#FFFFFF', textSec:'#F0D2B4', border:'#502814', badgeBg:'rgba(220,60,20,0.18)', badgeBd:'rgba(255,107,53,0.35)', shadow:'rgba(255,107,53,0.18)' },
}

export function getBmiCategory(bmi, female) {
  if (female) {
    if (bmi < 17.5) return 'Underweight'
    if (bmi < 24.0) return 'Normal'
    if (bmi < 29.0) return 'Overweight'
    return 'Obese'
  }
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25.0) return 'Normal'
  if (bmi < 30.0) return 'Overweight'
  return 'Obese'
}

export const BMI_COLOR = { Underweight:'#FFC400', Normal:'#00E5A8', Overweight:'#FF8C00', Obese:'#FF4860' }
export const BMI_NAME  = { Underweight:'Недостаток веса', Normal:'Норма', Overweight:'Избыточный вес', Obese:'Ожирение' }
export const BMI_REC   = {
  Underweight: 'Рекомендуется увеличить калорийность питания и проконсультироваться с врачом.',
  Normal:      'Отличный результат! Ваш вес идеален для участия в марафоне.',
  Overweight:  'Рекомендуется снизить вес для улучшения беговых показателей.',
  Obese:       'Необходима консультация врача перед участием в марафоне.',
}

export function calcAge(dateStr) {
  if (!dateStr) return '—'
  const b = new Date(dateStr), now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  if (new Date(now.getFullYear(), b.getMonth(), b.getDate()) > now) age--
  return age
}

export function getMarathonDate() {
  const now = new Date()
  let t = new Date(now.getFullYear(), 5, 25, 0, 0, 0)
  if (now >= t) t.setFullYear(t.getFullYear() + 1)
  return t
}
