import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Bed, Tag, Edit, Image, Calendar, PlusCircle, AlertTriangle } from 'lucide-react';
import type { PartnerRoom, PartnerRoomInput, RoomPrice, RoomPriceInput, RoomQuote } from '@/types/room';
import type { HomestayOptionsDto } from '@/types/partner';
import { partnerRoomService as api } from '@/services/partnerRoomService';
import { homestayError } from '@/services/partnerHomestayService';
import { isSubmittedChange } from '@/services/changeRequestService';
import MediaManager from '@/components/partner/MediaManager';
import RoomInventoryCalendar from '@/components/partner/RoomInventoryCalendar';

const blank: PartnerRoomInput = {name:'',description:'',maxOccupancy:2,totalRoomCount:1,privateBathroom:'UNVERIFIED',areaSqm:null,basePrice:0,weekendPrice:undefined,status:'ACTIVE',viewDescription:'',beds:[],amenityIds:[]};
const field='w-full rounded-md border border-border bg-surface p-2.5 text-sm focus:border-primary focus:outline-none';
const button='rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-teal)] hover:bg-primary-600 disabled:opacity-50 transition-colors';
const localDate=(offset: number) => { const d=new Date(); d.setDate(d.getDate()+offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const money=(n: number)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(n);

export default function PartnerRoomsPage() {
  const {id}=useParams(); const placeId=Number(id); const navigate=useNavigate();
  const [homestays, setHomestays] = useState<{ id: number; name: string }[]>([]);
  const [rooms,setRooms]=useState<PartnerRoom[]>([]); const [options,setOptions]=useState<HomestayOptionsDto['amenities']>([]);
  const [form,setForm]=useState<PartnerRoomInput|null>(null); const [editId,setEditId]=useState<number|null>(null);
  const [selected,setSelected]=useState<PartnerRoom|null>(null); const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{setLoading(true);try{const [r,o]=await Promise.all([api.list(placeId),api.options(placeId)]);setRooms(r);setOptions(o);setError('');}catch(e:unknown){setError(homestayError(e));}finally{setLoading(false);}},[placeId]);
  
  useEffect(() => {
    import('@/services/partnerHomestayService').then(({ fetchPartnerHomestays }) => {
      fetchPartnerHomestays().then(res => setHomestays(res.homestays.map(h => ({ id: h.id, name: h.name })))).catch(console.error);
    });
  }, []);
  
  useEffect(()=>{void load();},[load]);
  function set<K extends keyof PartnerRoomInput>(key:K,value:PartnerRoomInput[K]) {setForm(p=>p?{...p,[key]:value}:p);}
  async function save(){if(!form)return;setBusy(true);setError('');try{const saved=await api.save(placeId,editId,form);if(isSubmittedChange(saved))window.alert(saved.message);setForm(null);setSelected(null);await load();}catch(e:unknown){setError(homestayError(e));}finally{setBusy(false);}}
  
  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-center justify-between gap-5">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Quản lý sức chứa</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-deep sm:text-3xl">Phòng & lịch bán</h1>
          <select className="h-10 max-w-[240px] rounded-md border border-primary/20 bg-primary-50 px-3 text-sm font-bold text-primary-900 focus:border-primary focus:outline-none shadow-sm cursor-pointer" value={placeId} onChange={(e) => navigate(`/partner/homestay/${e.target.value}/rooms`)}>
            {homestays.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">Thêm phòng mới, cập nhật giá theo thời điểm và đóng mở lịch phục vụ.</p>
      </div>
      <button className="flex h-11 items-center gap-2 rounded-md bg-coral px-5 text-sm font-bold text-white shadow-[var(--shadow-coral)] hover:bg-coral-hover transition-colors" onClick={()=>{setEditId(null);setForm({...blank});setSelected(null);}}>
        <PlusCircle className="h-4 w-4" /> Thêm loại phòng
      </button>
    </div>

    {error&&<div role="alert" className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger"><AlertTriangle className="h-5 w-5"/>{error}</div>}
    
    {loading?<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[1,2].map(i=><div key={i} className="h-72 animate-pulse rounded-lg border border-primary/10 bg-surface"></div>)}</div>:
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map(r=>(
          <article key={r.id} className="flex flex-col overflow-hidden rounded-lg border border-primary/10 bg-surface shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] hover:border-primary/30">
            <div className="relative flex h-48 w-full items-center justify-center bg-primary-50">
              <Bed className="h-12 w-12 text-primary/30" />
              <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between">
                <span className={`flex items-center gap-1.5 rounded-sm px-2 py-1 text-[10px] font-bold text-white ${r.status==='ACTIVE'?'bg-primary':'bg-ink/80'}`}>{r.status==='ACTIVE'?'Đang mở bán':'Ngừng bán'}</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-5">
              <h3 className="font-display text-lg font-bold leading-snug text-ink-deep">{r.name}</h3>
              <div className="flex flex-col gap-1.5 text-xs text-muted">
                <span className="flex items-center gap-1.5"><Bed className="h-4 w-4 shrink-0 text-primary-300"/> {r.totalRoomCount} phòng · {r.maxOccupancy} khách/phòng</span>
                <span className="flex items-center gap-1.5"><Tag className="h-4 w-4 shrink-0 text-coral"/> {money(r.basePrice)}/đêm {r.weekendPrice ? `(Cuối tuần: ${money(r.weekendPrice)})` : ''}</span>
              </div>
              <p className="text-xs text-muted line-clamp-1">{r.viewDescription || 'Chưa khai báo vị trí/view'}</p>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-border mt-3">
                <button className="flex items-center justify-center gap-1.5 rounded-md bg-canvas py-2 text-xs font-semibold text-ink hover:bg-primary-50 hover:text-primary transition-colors" onClick={()=>{setEditId(r.id);setForm({...r,description:r.description??'',viewDescription:r.viewDescription??''});setSelected(null);}}><Edit className="h-3.5 w-3.5"/> Thông tin & Ảnh</button>
                <button className="flex items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-xs font-semibold text-white shadow-[var(--shadow-teal)] hover:bg-primary-600 transition-colors" onClick={()=>{setSelected(r);setForm(null);}}><Calendar className="h-3.5 w-3.5"/> Giá & lịch bán</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    }
    {!loading&&!rooms.length&&!error&&<div className="rounded-lg border border-dashed border-primary/30 p-10 text-center"><p className="text-muted">Chưa có loại phòng nào cho Homestay này. Hãy tạo loại phòng đầu tiên.</p></div>}
    {form&&<div className="rounded-lg border border-primary/20 bg-surface p-6 shadow-[var(--shadow-card)]">
      <h2 className="mb-5 font-display text-xl font-bold text-ink-deep">{editId?'Chỉnh sửa thông tin phòng':'Thêm loại phòng mới'}</h2>
      <form onSubmit={e=>{e.preventDefault();void save();}}><fieldset disabled={busy} className="space-y-5">
        <Label title="Tên loại phòng"><input required maxLength={255} className={field} value={form.name} onChange={e=>set('name',e.target.value)}/></Label>
        <div className="grid gap-5 sm:grid-cols-3"><Label title="Tổng số phòng"><input type="number" required min={1} max={10000} className={field} value={form.totalRoomCount} onChange={e=>set('totalRoomCount',Number(e.target.value))}/></Label><Label title="Sức chứa mỗi phòng (khách)"><input type="number" required min={1} max={1000} className={field} value={form.maxOccupancy} onChange={e=>set('maxOccupancy',Number(e.target.value))}/></Label><Label title="Diện tích (m²)"><input type="number" min={0.01} max={9999.99} step="0.01" className={field} value={form.areaSqm??''} onChange={e=>set('areaSqm',e.target.value?Number(e.target.value):null)}/></Label></div>
        <div className="grid gap-5 sm:grid-cols-2"><Label title="Giá cơ bản / phòng / đêm (VND)"><input required type="number" min={0} max={999999999999} className={field} value={form.basePrice} onChange={e=>set('basePrice',Number(e.target.value))}/></Label><Label title="Giá cuối tuần / phòng / đêm (VND)"><input type="number" min={0} max={999999999999} className={field} value={form.weekendPrice ?? ''} onChange={e=>set('weekendPrice',e.target.value ? Number(e.target.value) : undefined)} placeholder="Bằng giá cơ bản nếu trống"/></Label></div>
        <Label title="Vị trí / hướng nhìn"><input maxLength={500} className={field} value={form.viewDescription} onChange={e=>set('viewDescription',e.target.value)}/></Label>
        <Label title="Mô tả chi tiết"><textarea maxLength={10000} className={field} rows={4} value={form.description} onChange={e=>set('description',e.target.value)}/></Label>
        <div className="grid gap-5 sm:grid-cols-2"><Label title="Trạng thái mở bán"><select className={field} value={form.status} onChange={e=>set('status',e.target.value==='ACTIVE'?'ACTIVE':'INACTIVE')}><option value="ACTIVE">Đang mở bán</option><option value="INACTIVE">Ngừng bán tạm thời</option></select></Label><Label title="Phòng tắm riêng"><select className={field} value={form.privateBathroom} onChange={e=>set('privateBathroom',e.target.value==='YES'?'YES':e.target.value==='NO'?'NO':'UNVERIFIED')}><option value="UNVERIFIED">Chưa xác minh</option><option value="YES">Có phòng tắm riêng</option><option value="NO">Dùng chung phòng tắm</option></select></Label></div>
        
        <div className="space-y-3 rounded-md bg-canvas p-4 border border-border">
          <p className="font-semibold text-ink-deep">Giường ngủ</p>
          {form.beds.map((bed,i)=><div key={i} className="flex flex-wrap gap-3"><input aria-label="Loại giường" required maxLength={32} placeholder="Giường đôi, giường đơn..." className={field} style={{flex: 2}} value={bed.bedType} onChange={e=>set('beds',form.beds.map((b,j)=>i===j?{...b,bedType:e.target.value}:b))}/><input aria-label="Số lượng giường" required type="number" min={1} max={100} className={field} style={{flex: 1, minWidth: '100px'}} value={bed.quantity} onChange={e=>set('beds',form.beds.map((b,j)=>i===j?{...b,quantity:Number(e.target.value)}:b))}/><button type="button" className="text-danger hover:underline text-sm font-semibold px-2" onClick={()=>set('beds',form.beds.filter((_,j)=>j!==i))}>Xóa</button></div>)}
          <button type="button" className="text-primary text-sm font-bold hover:underline" onClick={()=>set('beds',[...form.beds,{bedType:'',quantity:1}])}>+ Thêm giường mới</button>
        </div>
        
        <div className="space-y-3">
          <p className="font-semibold text-ink-deep">Tiện nghi trong phòng</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{options.map(a=><label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary"><input type="checkbox" className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30" checked={form.amenityIds.includes(a.id)} onChange={e=>set('amenityIds',e.target.checked?[...form.amenityIds,a.id]:form.amenityIds.filter(id=>id!==a.id))}/><span>{a.name}</span></label>)}</div>
        </div>
        
        <div className="flex gap-3 pt-4 border-t border-border">
          <button className={button}>{busy?'Đang lưu...':'Lưu thông tin phòng'}</button>
          <button type="button" className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-canvas" onClick={()=>setForm(null)}>Hủy & Đóng</button>
        </div>
      </fieldset></form>

      <div className="mt-8 pt-8 border-t border-border">
        {editId ? (
          <MediaManager key={`media-${editId}`} target={{placeId,roomId:editId}} title="Ảnh phòng" />
        ) : (
          <div className="rounded-md bg-canvas p-6 text-center text-sm text-muted">Vui lòng "Lưu thông tin phòng" trước khi tải ảnh lên.</div>
        )}
      </div>
    </div>}
    {selected&&<RoomCalendar key={selected.id} placeId={placeId} room={selected} onClose={()=>setSelected(null)}/>}
  </div>;
}
function RoomCalendar({placeId,room,onClose}:{placeId:number;room:PartnerRoom;onClose:()=>void}) {
  const [start,setStart]=useState(localDate(0));const [end,setEnd]=useState(localDate(14));const [prices,setPrices]=useState<RoomPrice[]>([]);
  const [price,setPrice]=useState<RoomPriceInput>({name:'',periodStart:localDate(0),periodEnd:localDate(1),price:room.basePrice});const [priceId,setPriceId]=useState<number|null>(null);
  const [error,setError]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  const [count,setCount]=useState(1);const [guests,setGuests]=useState(2);const [quote,setQuote]=useState<RoomQuote|null>(null);
  const generation = useRef(0);
  const load=useCallback(async()=>{
    const request = ++generation.current;
    try {
      const p=await api.prices(placeId,room.id);
      if (request !== generation.current) return;
      setPrices(p);setError('');
    } catch (e: unknown) {
      if (request === generation.current) setError(homestayError(e));
    }
  },[placeId,room.id]);
  useEffect(()=>{setQuote(null);setError('');void load();return()=>{generation.current += 1;};},[load]);
  async function act(action:()=>Promise<unknown>,text:string){setBusy(true);setError('');setMessage('');try{const result=await action();await load();setQuote(null);setMessage(isSubmittedChange(result)?result.message:text);}catch(e:unknown){setError(homestayError(e));}finally{setBusy(false);}}
  return <section className="space-y-6 rounded-lg border border-primary/20 bg-surface p-6 shadow-[var(--shadow-card)]">
    <div className="flex items-center justify-between border-b border-border pb-4">
      <h2 className="font-display text-xl font-bold text-ink-deep">{room.name} — Giá & lịch phòng</h2>
      <button onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold hover:bg-canvas">Đóng</button>
    </div>
    {error&&<p role="alert" className="text-danger bg-danger/5 p-3 rounded-md">{error}</p>}{message&&<p role="status" className="text-primary bg-primary-50 p-3 rounded-md">{message}</p>}
    <div className="space-y-3"><h3 className="font-bold text-ink-deep">Lịch phòng theo ngày</h3><RoomInventoryCalendar placeId={placeId} room={room} onChanged={()=>void load()}/></div>
    <h3 className="font-semibold">Kiểm tra khả năng đáp ứng</h3>
    <fieldset disabled={busy} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Label title="Từ ngày"><input className={field} type="date" value={start} onChange={e=>setStart(e.target.value)}/></Label><Label title="Đến ngày (không bao gồm)"><input className={field} type="date" min={start} value={end} onChange={e=>setEnd(e.target.value)}/></Label></div>
      <form onSubmit={e=>{e.preventDefault();setBusy(true);setError('');void api.quote(placeId,room.id,start,end,count,guests).then(setQuote).catch((err:unknown)=>setError(homestayError(err))).finally(()=>setBusy(false));}} className="flex flex-wrap items-end gap-3"><Label title="Số phòng cần"><input required type="number" min={1} className={field} value={count} onChange={e=>setCount(Number(e.target.value))}/></Label><Label title="Số khách"><input required type="number" min={1} className={field} value={guests} onChange={e=>setGuests(Number(e.target.value))}/></Label><button className={button}>Kiểm tra khả năng phục vụ</button></form>
      {quote&&<p role="status">{quote.suitable?'Có thể đáp ứng':'Không đủ phòng hoặc sức chứa'} · còn tối thiểu {quote.availableRooms} phòng · Tổng tiền: {money(quote.totalAmount)}</p>}
      <h3 className="font-bold text-ink-deep mt-6 border-t border-border pt-6">Giá theo thời điểm</h3>
      <p className="text-xs text-muted mb-4">Giá đặc biệt tính cả ngày bắt đầu và ngày kết thúc. Các khoảng giá không được trùng nhau.</p>
      <div className="grid gap-3">
        {prices.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-canvas p-3 text-sm"><span className="font-medium text-ink-deep">{p.name}: <span className="font-normal text-ink">{p.periodStart} → {p.periodEnd}</span> · <span className="font-bold text-coral-hover">{money(p.price)}</span></span><div className="flex gap-3"><button type="button" className="text-primary hover:underline font-semibold" onClick={()=>{setPrice(p);setPriceId(p.id);}}>Sửa</button><button type="button" className="text-danger hover:underline font-semibold" onClick={()=>void act(()=>api.deletePrice(placeId,room.id,p.id),'Đã xóa khoảng giá.')}>Xóa</button></div></div>)}
      </div>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();void act(async()=>{const saved=await api.savePrice(placeId,room.id,priceId,price);setPriceId(null);setPrice({...price,name:''});return saved;},'Đã lưu giá.');}}>
        <Label title="Tên bảng giá"><input required maxLength={255} className={field} value={price.name} onChange={e=>setPrice({...price,name:e.target.value})}/></Label><Label title="Giá / đêm"><input required min={0} type="number" className={field} value={price.price} onChange={e=>setPrice({...price,price:Number(e.target.value)})}/></Label><Label title="Bắt đầu"><input required type="date" className={field} value={price.periodStart} onChange={e=>setPrice({...price,periodStart:e.target.value})}/></Label><Label title="Kết thúc"><input required type="date" min={price.periodStart} className={field} value={price.periodEnd} onChange={e=>setPrice({...price,periodEnd:e.target.value})}/></Label>
        <div className="col-span-1 sm:col-span-2 flex gap-3 mt-2"><button className={button}>{priceId?'Lưu thay đổi giá':'Thêm khoảng giá'}</button>{priceId&&<button type="button" className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-canvas" onClick={()=>{setPriceId(null);setPrice({...price,name:''});}}>Hủy sửa</button>}</div>
      </form>
    </fieldset>
  </section>;
}
function Label({title,children}:{title:string;children:ReactNode}) {return <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-deep">{title}{children}</label>;}
