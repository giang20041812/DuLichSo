import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { PartnerRoom, PartnerRoomInput, RoomPrice, RoomPriceInput, RoomInventoryDay, RoomQuote } from '@/types/room';
import type { HomestayOptionsDto } from '@/types/partner';
import { partnerRoomService as api } from '@/services/partnerRoomService';
import { homestayError } from '@/services/partnerHomestayService';
import MediaManager from '@/components/partner/MediaManager';

const blank: PartnerRoomInput = {name:'',description:'',maxOccupancy:2,totalRoomCount:1,privateBathroom:'UNVERIFIED',areaSqm:null,basePrice:0,status:'ACTIVE',viewDescription:'',beds:[],amenityIds:[]};
const field='w-full rounded-md border border-border bg-surface p-2 text-sm';
const button='rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
const localDate=(offset: number) => { const d=new Date(); d.setDate(d.getDate()+offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const money=(n: number)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(n);

export default function PartnerRoomsPage() {
  const {id}=useParams(); const placeId=Number(id);
  const [rooms,setRooms]=useState<PartnerRoom[]>([]); const [options,setOptions]=useState<HomestayOptionsDto['amenities']>([]);
  const [form,setForm]=useState<PartnerRoomInput|null>(null); const [editId,setEditId]=useState<number|null>(null);
  const [selected,setSelected]=useState<PartnerRoom|null>(null); const [photoRoom,setPhotoRoom]=useState<PartnerRoom|null>(null); const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{setLoading(true);try{const [r,o]=await Promise.all([api.list(placeId),api.options(placeId)]);setRooms(r);setOptions(o);setError('');}catch(e:unknown){setError(homestayError(e));}finally{setLoading(false);}},[placeId]);
  useEffect(()=>{void load();},[load]);
  function set<K extends keyof PartnerRoomInput>(key:K,value:PartnerRoomInput[K]) {setForm(p=>p?{...p,[key]:value}:p);}
  async function save(){if(!form)return;setBusy(true);setError('');try{await api.save(placeId,editId,form);setForm(null);setSelected(null);await load();}catch(e:unknown){setError(homestayError(e));}finally{setBusy(false);}}
  return <div className="space-y-5">
    <Link to={`/partner/homestay/${placeId}`} className="text-primary">← Thông tin Homestay</Link>
    <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold">Phòng, giá và lịch bán</h1><button className={button} onClick={()=>{setEditId(null);setForm({...blank});setSelected(null);setPhotoRoom(null);}}>Thêm loại phòng</button></div>
    {error&&<p role="alert" className="rounded-md border border-danger/30 p-3 text-danger">{error}</p>}
    {loading?<p role="status">Đang tải...</p>:<div className="grid gap-4 md:grid-cols-2">{rooms.map(r=><section key={r.id} className="space-y-3 rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <h2 className="font-bold">{r.name}</h2><p className="text-sm">{r.totalRoomCount} phòng · {r.maxOccupancy} khách/phòng · {money(r.basePrice)}/đêm</p><p className="text-sm text-muted">{r.status==='ACTIVE'?'Đang mở bán':'Ngừng bán'} · {r.viewDescription || 'Chưa khai báo vị trí/view'}</p>
      <div className="flex gap-3"><button className={button} onClick={()=>{setEditId(r.id);setForm({...r,description:r.description??'',viewDescription:r.viewDescription??''});setSelected(null);setPhotoRoom(null);}}>Sửa thông tin</button><button className="rounded-md border border-primary px-3 text-sm text-primary" onClick={()=>{setSelected(r);setForm(null);setPhotoRoom(null);}}>Giá & lịch phòng</button><button className="rounded-md border border-border px-3 text-sm text-ink" onClick={()=>{setPhotoRoom(r);setSelected(null);setForm(null);}}>Ảnh phòng</button></div>
    </section>)}</div>}
    {!loading&&!rooms.length&&!error&&<p>Chưa có loại phòng. Hãy tạo loại phòng đầu tiên.</p>}
    {form&&<form onSubmit={e=>{e.preventDefault();void save();}} className="rounded-lg border border-border bg-surface p-5"><fieldset disabled={busy} className="space-y-4">
      <h2 className="font-bold">{editId?'Chỉnh sửa loại phòng':'Loại phòng mới'}</h2>
      <Label title="Tên loại phòng"><input required maxLength={255} className={field} value={form.name} onChange={e=>set('name',e.target.value)}/></Label>
      <div className="grid gap-4 sm:grid-cols-3"><Label title="Tổng số phòng"><input type="number" required min={1} max={10000} className={field} value={form.totalRoomCount} onChange={e=>set('totalRoomCount',Number(e.target.value))}/></Label><Label title="Sức chứa mỗi phòng"><input type="number" required min={1} max={1000} className={field} value={form.maxOccupancy} onChange={e=>set('maxOccupancy',Number(e.target.value))}/></Label><Label title="Diện tích (m²)"><input type="number" min={0.01} max={9999.99} step="0.01" className={field} value={form.areaSqm??''} onChange={e=>set('areaSqm',e.target.value?Number(e.target.value):null)}/></Label></div>
      <Label title="Giá cơ bản / phòng / đêm (VND)"><input required type="number" min={0} max={999999999999} className={field} value={form.basePrice} onChange={e=>set('basePrice',Number(e.target.value))}/></Label>
      <Label title="Vị trí / hướng nhìn"><input maxLength={500} className={field} value={form.viewDescription} onChange={e=>set('viewDescription',e.target.value)}/></Label>
      <Label title="Mô tả"><textarea maxLength={10000} className={field} value={form.description} onChange={e=>set('description',e.target.value)}/></Label>
      <div className="grid gap-4 sm:grid-cols-2"><Label title="Trạng thái"><select className={field} value={form.status} onChange={e=>set('status',e.target.value==='ACTIVE'?'ACTIVE':'INACTIVE')}><option value="ACTIVE">Mở bán</option><option value="INACTIVE">Ngừng bán</option></select></Label><Label title="Phòng tắm riêng"><select className={field} value={form.privateBathroom} onChange={e=>set('privateBathroom',e.target.value==='YES'?'YES':e.target.value==='NO'?'NO':'UNVERIFIED')}><option value="UNVERIFIED">Chưa xác minh</option><option value="YES">Có</option><option value="NO">Không</option></select></Label></div>
      <div className="space-y-2"><p className="font-semibold">Giường ngủ</p>{form.beds.map((bed,i)=><div key={i} className="flex gap-2"><input aria-label="Loại giường" required maxLength={32} placeholder="Giường đôi, giường đơn..." className={field} value={bed.bedType} onChange={e=>set('beds',form.beds.map((b,j)=>i===j?{...b,bedType:e.target.value}:b))}/><input aria-label="Số lượng giường" required type="number" min={1} max={100} className={field} value={bed.quantity} onChange={e=>set('beds',form.beds.map((b,j)=>i===j?{...b,quantity:Number(e.target.value)}:b))}/><button type="button" onClick={()=>set('beds',form.beds.filter((_,j)=>j!==i))}>Xóa</button></div>)}<button type="button" className="text-primary" onClick={()=>set('beds',[...form.beds,{bedType:'',quantity:1}])}>+ Thêm giường</button></div>
      <div className="grid gap-2 sm:grid-cols-2">{options.map(a=><label key={a.id} className="flex gap-2 text-sm"><input type="checkbox" checked={form.amenityIds.includes(a.id)} onChange={e=>set('amenityIds',e.target.checked?[...form.amenityIds,a.id]:form.amenityIds.filter(id=>id!==a.id))}/>{a.name}</label>)}</div>
      <p className="text-xs text-muted">Số lượng theo từng ngày được quản lý tại lịch phòng. Giá mới áp dụng cho yêu cầu đặt mới; đơn đã đặt giữ giá đã ghi nhận.</p>
      <div className="flex gap-3"><button className={button}>{busy?'Đang lưu...':'Lưu loại phòng'}</button><button type="button" onClick={()=>setForm(null)}>Đóng</button></div>
    </fieldset></form>}
    {selected&&<RoomCalendar key={selected.id} placeId={placeId} room={selected}/>}
    {photoRoom&&<section className="rounded-lg border border-border bg-surface p-5"><MediaManager key={photoRoom.id} target={{placeId,roomId:photoRoom.id}} title={`Ảnh phòng — ${photoRoom.name}`}/></section>}
  </div>;
}
function RoomCalendar({placeId,room}:{placeId:number;room:PartnerRoom}) {
  const [start,setStart]=useState(localDate(0));const [end,setEnd]=useState(localDate(14));const [days,setDays]=useState<RoomInventoryDay[]>([]);const [prices,setPrices]=useState<RoomPrice[]>([]);
  const [price,setPrice]=useState<RoomPriceInput>({name:'',periodStart:localDate(0),periodEnd:localDate(1),price:room.basePrice});const [priceId,setPriceId]=useState<number|null>(null);
  const [total,setTotal]=useState(room.totalRoomCount);const [stop,setStop]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  const [count,setCount]=useState(1);const [guests,setGuests]=useState(2);const [quote,setQuote]=useState<RoomQuote|null>(null);
  const generation = useRef(0);
  const load=useCallback(async()=>{
    const request = ++generation.current;
    try {
      const [d,p]=await Promise.all([api.calendar(placeId,room.id,start,end),api.prices(placeId,room.id)]);
      if (request !== generation.current) return;
      setDays(d);setPrices(p);setError('');
    } catch (e: unknown) {
      if (request === generation.current) setError(homestayError(e));
    }
  },[placeId,room.id,start,end]);
  useEffect(()=>{setQuote(null);setDays([]);setError('');void load();return()=>{generation.current += 1;};},[load]);
  async function act(action:()=>Promise<unknown>,text:string){setBusy(true);setError('');setMessage('');try{await action();await load();setQuote(null);setMessage(text);}catch(e:unknown){setError(homestayError(e));}finally{setBusy(false);}}
  return <section className="space-y-5 rounded-lg border border-border bg-surface p-5">
    <h2 className="text-lg font-bold">{room.name} — Giá & lịch phòng</h2>
    {error&&<p role="alert" className="text-danger">{error}</p>}{message&&<p role="status" className="text-primary">{message}</p>}
    <fieldset disabled={busy} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Label title="Từ ngày"><input className={field} type="date" value={start} onChange={e=>setStart(e.target.value)}/></Label><Label title="Đến ngày (không bao gồm)"><input className={field} type="date" min={start} value={end} onChange={e=>setEnd(e.target.value)}/></Label></div>
      <form onSubmit={e=>{e.preventDefault();void act(()=>api.inventory(placeId,room.id,{startDate:start,endDate:end,totalRooms:total,stopSell:stop}),'Đã cập nhật lịch phòng.');}} className="flex flex-wrap items-end gap-4">
        <Label title="Số phòng cung cấp mỗi ngày"><input required className={field} type="number" min={0} max={room.totalRoomCount} value={total} onChange={e=>setTotal(Number(e.target.value))}/></Label><label className="flex gap-2 text-sm"><input type="checkbox" checked={stop} onChange={e=>setStop(e.target.checked)}/>Đóng bán khoảng ngày này</label><button className={button}>Cập nhật tồn phòng</button>
      </form>
      <form onSubmit={e=>{e.preventDefault();setBusy(true);setError('');void api.quote(placeId,room.id,start,end,count,guests).then(setQuote).catch((err:unknown)=>setError(homestayError(err))).finally(()=>setBusy(false));}} className="flex flex-wrap items-end gap-3"><Label title="Số phòng cần"><input required type="number" min={1} className={field} value={count} onChange={e=>setCount(Number(e.target.value))}/></Label><Label title="Số khách"><input required type="number" min={1} className={field} value={guests} onChange={e=>setGuests(Number(e.target.value))}/></Label><button className={button}>Kiểm tra khả năng phục vụ</button></form>
      {quote&&<p role="status">{quote.suitable?'Có thể đáp ứng':'Không đủ phòng hoặc sức chứa'} · còn tối thiểu {quote.availableRooms} phòng · Tổng tiền: {money(quote.totalAmount)}</p>}
      <div className="max-h-80 overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th>Ngày</th><th>Tổng</th><th>Giữ chỗ</th><th>Đã xác nhận</th><th>Còn</th><th>Giá/đêm</th><th>Bán</th></tr></thead><tbody>{days.map(d=><tr key={d.stayDate} className="border-t border-border"><td className="py-2">{d.stayDate}</td><td>{d.totalRooms}</td><td>{d.heldRooms}</td><td>{d.confirmedRooms}</td><td>{d.availableRooms}</td><td>{money(d.price)}</td><td>{d.stopSell?'Đóng':'Mở'}</td></tr>)}</tbody></table></div>
      <h3 className="font-semibold">Giá theo thời điểm</h3>
      <p className="text-xs text-muted">Giá đặc biệt tính cả ngày bắt đầu và ngày kết thúc. Các khoảng giá không được trùng nhau.</p>
      {prices.map(p=><div key={p.id} className="flex flex-wrap justify-between gap-3 border-b border-border py-2 text-sm"><span>{p.name}: {p.periodStart} → {p.periodEnd} · {money(p.price)}</span><div className="flex gap-3"><button type="button" className="text-primary" onClick={()=>{setPrice(p);setPriceId(p.id);}}>Sửa</button><button type="button" className="text-danger" onClick={()=>void act(()=>api.deletePrice(placeId,room.id,p.id),'Đã xóa khoảng giá.')}>Xóa</button></div></div>)}
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();void act(async()=>{await api.savePrice(placeId,room.id,priceId,price);setPriceId(null);setPrice({...price,name:''});},'Đã lưu giá.');}}>
        <Label title="Tên bảng giá"><input required maxLength={255} className={field} value={price.name} onChange={e=>setPrice({...price,name:e.target.value})}/></Label><Label title="Giá / đêm"><input required min={0} type="number" className={field} value={price.price} onChange={e=>setPrice({...price,price:Number(e.target.value)})}/></Label><Label title="Bắt đầu"><input required type="date" className={field} value={price.periodStart} onChange={e=>setPrice({...price,periodStart:e.target.value})}/></Label><Label title="Kết thúc"><input required type="date" min={price.periodStart} className={field} value={price.periodEnd} onChange={e=>setPrice({...price,periodEnd:e.target.value})}/></Label><button className={button}>{priceId?'Lưu thay đổi giá':'Thêm khoảng giá'}</button>{priceId&&<button type="button" onClick={()=>{setPriceId(null);setPrice({...price,name:''});}}>Hủy sửa</button>}
      </form>
    </fieldset>
  </section>;
}
function Label({title,children}:{title:string;children:ReactNode}) {return <label className="flex flex-col gap-1 text-sm">{title}{children}</label>;}
