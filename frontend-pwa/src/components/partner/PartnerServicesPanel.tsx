import {useEffect,useState} from 'react';
import axios from 'axios';
import type {HomestayServiceOffer,HomestayServiceInput} from '@/types/homestay';
import {homestayError} from '@/services/partnerHomestayService';
const empty:HomestayServiceInput={name:'',description:'',price:null,priceUnit:'',active:true};
const input='rounded-md border border-border bg-surface p-2 text-sm';
export default function PartnerServicesPanel({placeId}:{placeId:number}) {
  const [items,setItems]=useState<HomestayServiceOffer[]>([]);const [form,setForm]=useState<HomestayServiceInput|null>(null);const [id,setId]=useState<number|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const url=`/api/v1/partner/homestays/${placeId}/services`;
  const auth=()=>({headers:{Authorization:`Bearer ${localStorage.getItem('portal_token')??''}`}});
  useEffect(()=>{let active=true;axios.get<HomestayServiceOffer[]>(url,{headers:{Authorization:`Bearer ${localStorage.getItem('portal_token')??''}`}}).then(r=>{if(active)setItems(r.data);}).catch((e:unknown)=>{if(active)setError(homestayError(e));});return()=>{active=false;};},[url]);
  return <section className="space-y-4 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-card)]"><div className="flex justify-between"><h2 className="font-semibold text-primary">Dịch vụ Homestay</h2><button className="text-primary" onClick={()=>{setId(null);setForm({...empty});}}>+ Thêm dịch vụ</button></div>
    {error&&<p role="alert" className="text-danger">{error}</p>}
    {!items.length&&!error&&<p className="text-sm text-muted">Chưa khai báo dịch vụ.</p>}
    {items.map(item=><div key={item.id} className="flex justify-between gap-3 border-b border-border py-2 text-sm"><div><p className="font-semibold">{item.name} · {item.active?'Đang cung cấp':'Tạm ngừng'}</p><p>{item.description}</p><p>{item.price==null?'Liên hệ báo giá':`${item.price.toLocaleString('vi-VN')}đ ${item.priceUnit??''}`}</p></div><button className="text-primary" onClick={()=>{setId(item.id);setForm(item);}}>Sửa</button></div>)}
    {form&&<form onSubmit={e=>{e.preventDefault();setBusy(true);setError('');void axios.request<HomestayServiceOffer>({url:id?`${url}/${id}`:url,method:id?'PUT':'POST',data:form,...auth()}).then(r=>{setItems(prev=>id?prev.map(i=>i.id===id?r.data:i):[...prev,r.data]);setForm(null);}).catch((err:unknown)=>setError(homestayError(err))).finally(()=>setBusy(false));}}><fieldset disabled={busy} className="grid gap-3">
      <label className="grid gap-1 text-sm">Tên dịch vụ<input required maxLength={255} className={input} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label className="grid gap-1 text-sm">Mô tả<textarea maxLength={10000} className={input} value={form.description??''} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm">Giá (để trống nếu cần liên hệ)<input type="number" min={0} max={999999999999} className={input} value={form.price??''} onChange={e=>setForm({...form,price:e.target.value===''?null:Number(e.target.value)})}/></label><label className="grid gap-1 text-sm">Đơn vị tính<input maxLength={64} className={input} placeholder="/người, /lượt..." value={form.priceUnit??''} onChange={e=>setForm({...form,priceUnit:e.target.value})}/></label></div>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/>Đang cung cấp</label>
      <div className="flex gap-3"><button className="rounded-md bg-primary px-4 py-2 text-white">{busy?'Đang lưu...':'Lưu dịch vụ'}</button><button type="button" onClick={()=>setForm(null)}>Hủy</button></div>
    </fieldset></form>}
  </section>;
}
