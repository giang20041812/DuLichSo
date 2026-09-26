package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.*;
import com.dulichso.bookingapi.dto.partner.PartnerHomestayDtos.OptionDto;
import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.enums.*;
import com.dulichso.bookingapi.entity.keys.RoomAmenityId;
import com.dulichso.bookingapi.repository.RoomTypeRepository;
import com.dulichso.bookingapi.security.UserPrincipal;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class PartnerRoomService {
    private final PartnerHomestayService homestays;
    private final RoomTypeRepository rooms;
    private final RoomCalendarService calendar;
    private final EntityManager em;
    private final PartnerAuditRecorder audit;

    public RoomType owned(UserPrincipal principal, Long placeId, Long roomId, boolean writing) {
        var actor=homestays.actor(principal,writing);
        homestays.owned(placeId,actor,false);
        RoomType room=(writing?rooms.findLockedById(roomId):rooms.findById(roomId)).orElseThrow(()->bad("Không tìm thấy loại phòng."));
        if (!room.getPlace().getId().equals(placeId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy loại phòng của Homestay.");
        return room;
    }
    public List<OptionDto> options(UserPrincipal principal) {
        homestays.actor(principal,false);
        return em.createQuery("select a from Amenity a where a.scope=:scope and a.isActive=true order by a.sortOrder",Amenity.class)
                .setParameter("scope",AmenityScope.ROOM).getResultStream().map(a->new OptionDto(a.getId(),a.getName())).toList();
    }
    public List<RoomDto> list(UserPrincipal principal, Long placeId) {
        homestays.owned(placeId,homestays.actor(principal,false),false);
        List<RoomType> list=rooms.findByPlaceId(placeId);
        List<Long> ids=list.stream().map(RoomType::getId).toList();
        if(ids.isEmpty()) return List.of();
        var beds=em.createQuery("select b from RoomBed b where b.roomType.id in :ids order by b.id",RoomBed.class).setParameter("ids",ids).getResultStream()
                .collect(Collectors.groupingBy(b->b.getRoomType().getId()));
        var amenities=em.createQuery("select a from RoomAmenity a where a.roomType.id in :ids and a.value=:yes",RoomAmenity.class)
                .setParameter("ids",ids).setParameter("yes",AmenityValue.YES).getResultStream().collect(Collectors.groupingBy(a->a.getRoomType().getId()));
        return list.stream().map(r->new RoomDto(r.getId(),placeId,r.getName(),r.getDescription(),r.getMaxOccupancy(),r.getTotalRoomCount(),
                r.getPrivateBathroom(),r.getAreaSqm(),r.getBasePrice(),r.getWeekendPrice(),r.getStatus(),r.getViewDescription(),
                beds.getOrDefault(r.getId(),List.of()).stream().map(b->new BedDto(b.getBedType(),b.getQuantity())).toList(),
                amenities.getOrDefault(r.getId(),List.of()).stream().map(a->a.getId().getAmenityId()).toList())).toList();
    }
    @Transactional
    public RoomDto save(UserPrincipal principal,Long placeId,Long roomId,RoomInput input) {
        var actor=homestays.actor(principal,true);
        // Parent lock serializes room names and base capacity edits for this property.
        Place place=homestays.owned(placeId,actor,true);
        RoomType room=roomId==null?RoomType.builder().place(place).build():owned(principal,placeId,roomId,true);
        Long duplicate=em.createQuery("select count(r) from RoomType r where r.place.id=:place and lower(r.name)=:name and (:id is null or r.id<>:id)",Long.class)
                .setParameter("place",placeId).setParameter("name",input.name().trim().toLowerCase(Locale.ROOT)).setParameter("id",roomId).getSingleResult();
        if(duplicate>0) throw bad("Tên loại phòng đã tồn tại trong Homestay.");
        List<Amenity> selected=input.amenityIds().isEmpty()?List.of():em.createQuery("select a from Amenity a where a.id in :ids and a.scope=:scope and a.isActive=true",Amenity.class)
                .setParameter("ids",input.amenityIds()).setParameter("scope",AmenityScope.ROOM).getResultList();
        if(selected.size()!=new HashSet<>(input.amenityIds()).size()) throw bad("Tiện nghi phòng không hợp lệ.");
        Map<String,Object> before=roomId==null?null:roomSnapshot(room);
        if(roomId!=null && !input.totalRoomCount().equals(room.getTotalRoomCount())) {
            // Đồng bộ các ngày đã có trên lịch: giữ nguyên số phòng NCC đã tạm khóa (phòng hỏng) bằng cách dịch theo chênh lệch,
            // nhưng không vượt tổng mới và không thấp hơn số phòng đang giữ/xác nhận (tránh overbooking — NFR-REL-02).
            int delta=input.totalRoomCount()-room.getTotalRoomCount();
            List<RoomInventoryDay> future=em.createQuery("select d from RoomInventoryDay d where d.roomType.id=:id and d.id.stayDate>=:today",RoomInventoryDay.class)
                    .setParameter("id",roomId).setParameter("today",LocalDate.now()).getResultList();
            for(RoomInventoryDay day:future) {
                int next=Math.max(0,Math.min(input.totalRoomCount(),day.getTotalRooms()+delta));
                if(next<day.getHeldRooms()+day.getConfirmedRooms())
                    throw bad("Ngày "+day.getId().getStayDate()+" đã có "+(day.getHeldRooms()+day.getConfirmedRooms())+" phòng được giữ/xác nhận, không thể giảm tổng số phòng như vậy.");
                day.setTotalRooms(next); day.setUpdatedAt(java.time.LocalDateTime.now());
            }
        }
        room.setName(input.name().trim()); room.setDescription(input.description()); room.setMaxOccupancy(input.maxOccupancy());
        room.setTotalRoomCount(input.totalRoomCount()); room.setAreaSqm(input.areaSqm()); room.setPrivateBathroom(input.privateBathroom());
        room.setBasePrice(input.basePrice()); room.setWeekendPrice(input.weekendPrice()); room.setStatus(input.status()); room.setViewDescription(input.viewDescription());
        if(roomId==null) em.persist(room);
        em.createQuery("delete from RoomBed b where b.roomType.id=:id").setParameter("id",room.getId()).executeUpdate();
        em.createQuery("delete from RoomAmenity a where a.roomType.id=:id").setParameter("id",room.getId()).executeUpdate();
        for(BedDto bed:input.beds()) em.persist(RoomBed.builder().roomType(room).bedType(bed.bedType().trim()).quantity(bed.quantity()).build());
        for(Amenity a:selected) em.persist(RoomAmenity.builder().id(new RoomAmenityId(room.getId(),a.getId())).roomType(room).amenity(a).value(AmenityValue.YES).build());
        em.flush();
        // Refresh reference prices used by the public homestay cards.
        Object[] range=em.createQuery("select min(r.basePrice),max(r.basePrice) from RoomType r where r.place.id=:id and r.status='ACTIVE'",Object[].class).setParameter("id",placeId).getSingleResult();
        place.setPriceRefMin((java.math.BigDecimal)range[0]); place.setPriceRefMax((java.math.BigDecimal)range[1]); place.setPriceUnitNote("đêm");
        Map<String,Object> after=roomSnapshot(room);
        if(!after.equals(before)) audit.record(actor,roomId==null?"ROOM_CREATE":"ROOM_UPDATE",PartnerAuditRecorder.ROOM_TYPE,room.getId(),null,before,after);
        return new RoomDto(room.getId(),placeId,room.getName(),room.getDescription(),room.getMaxOccupancy(),room.getTotalRoomCount(),room.getPrivateBathroom(),room.getAreaSqm(),room.getBasePrice(),room.getWeekendPrice(),room.getStatus(),room.getViewDescription(),input.beds(),input.amenityIds());
    }
    public List<PriceDto> prices(UserPrincipal p,Long placeId,Long id) {
        owned(p,placeId,id,false);
        return em.createQuery("select p from RoomSpecialPrice p where p.roomType.id=:id order by p.periodStart",RoomSpecialPrice.class).setParameter("id",id)
                .getResultStream().map(v->new PriceDto(v.getId(),v.getName(),v.getPeriodStart(),v.getPeriodEnd(),v.getPrice())).toList();
    }
    @Transactional
    public PriceDto savePrice(UserPrincipal p,Long placeId,Long id,Long priceId,PriceInput input) {
        RoomType room=owned(p,placeId,id,true);
        var actor=homestays.actor(p,true);
        if(input.periodEnd().isBefore(input.periodStart())) throw bad("Ngày kết thúc giá phải bằng hoặc sau ngày bắt đầu.");
        Long overlap=em.createQuery("select count(p) from RoomSpecialPrice p where p.roomType.id=:room and p.periodStart<=:end and p.periodEnd>=:start and (:id is null or p.id<>:id)",Long.class)
                .setParameter("room",id).setParameter("start",input.periodStart()).setParameter("end",input.periodEnd()).setParameter("id",priceId).getSingleResult();
        if(overlap>0) throw bad("Khoảng giá bị trùng với một bảng giá đã có.");
        RoomSpecialPrice price=priceId==null?RoomSpecialPrice.builder().roomType(room).createdBy(actor).build():em.find(RoomSpecialPrice.class,priceId);
        if(price==null || !price.getRoomType().getId().equals(id)) throw bad("Không tìm thấy bảng giá.");
        Map<String,Object> before=priceId==null?null:priceSnapshot(price);
        price.setName(input.name().trim()); price.setPeriodStart(input.periodStart()); price.setPeriodEnd(input.periodEnd()); price.setPrice(input.price());
        if(priceId==null) em.persist(price);
        audit.record(actor,priceId==null?"SPECIAL_PRICE_CREATE":"SPECIAL_PRICE_UPDATE",PartnerAuditRecorder.ROOM_TYPE,id,null,before,priceSnapshot(price));
        return new PriceDto(price.getId(),price.getName(),price.getPeriodStart(),price.getPeriodEnd(),price.getPrice());
    }
    @Transactional
    public void deletePrice(UserPrincipal p,Long placeId,Long id,Long priceId) {
        owned(p,placeId,id,true);
        RoomSpecialPrice price=em.find(RoomSpecialPrice.class,priceId);
        if(price==null || !price.getRoomType().getId().equals(id)) throw bad("Không tìm thấy bảng giá.");
        audit.record(homestays.actor(p,true),"SPECIAL_PRICE_DELETE",PartnerAuditRecorder.ROOM_TYPE,id,null,priceSnapshot(price),null);
        em.remove(price);
    }
    public List<InventoryDto> calendar(UserPrincipal p,Long placeId,Long id,LocalDate start,LocalDate end) {return calendar.calendar(owned(p,placeId,id,false),start,end);}
    public QuoteDto quote(UserPrincipal p,Long placeId,Long id,LocalDate start,LocalDate end,int rooms,int guests) {return calendar.quote(owned(p,placeId,id,false),start,end,rooms,guests);}
    /** Cập nhật số phòng mở bán / ngừng bán theo ngày cho một loại phòng, kèm lý do (phòng hỏng, bảo trì, nghỉ phục vụ...). */
    @Transactional
    public void inventory(UserPrincipal p,Long placeId,Long id,InventoryInput input) {
        RoomType room=owned(p,placeId,id,true); RoomCalendarService.validateDates(input.startDate(),input.endDate());
        if(input.startDate().isBefore(LocalDate.now())) throw bad("Không sửa tồn phòng trong quá khứ.");
        if(input.totalRooms()>room.getTotalRoomCount()) throw bad("Tồn phòng không được vượt tổng số phòng của loại phòng.");
        String reason=blockReason(input.stopSell() || input.totalRooms()<room.getTotalRoomCount(),input.reason());
        for(LocalDate date=input.startDate();date.isBefore(input.endDate());date=date.plusDays(1)) {
            var day=calendar.lockedDay(room,date);
            if(input.totalRooms()<day.getHeldRooms()+day.getConfirmedRooms()) throw bad("Ngày "+date+" đã có nhiều phòng được giữ/xác nhận hơn số nhập vào.");
            day.setTotalRooms(input.totalRooms()); day.setStopSell(input.stopSell()); day.setBlockReason(reason); day.setUpdatedAt(java.time.LocalDateTime.now());
        }
        audit.record(homestays.actor(p,true),"INVENTORY_UPDATE",PartnerAuditRecorder.ROOM_TYPE,id,reason,null,
                Map.of("startDate",input.startDate().toString(),"endDate",input.endDate().toString(),"totalRooms",input.totalRooms(),"stopSell",input.stopSell()));
    }
    /**
     * Ngừng / mở phục vụ cả Homestay trong khoảng ngày: áp dụng cho mọi loại phòng (khóa theo thứ tự id để tránh deadlock).
     * Ngày ngừng phục vụ vẫn giữ nguyên các đơn đã giữ/xác nhận; chỉ chặn khách đặt mới.
     */
    @Transactional
    public int blockHomestay(UserPrincipal p,Long placeId,HomestayBlockInput input) {
        var actor=homestays.actor(p,true);
        homestays.owned(placeId,actor,true);
        RoomCalendarService.validateDates(input.startDate(),input.endDate());
        if(input.startDate().isBefore(LocalDate.now())) throw bad("Không sửa lịch trong quá khứ.");
        String reason=blockReason(input.stopSell(),input.reason());
        List<RoomType> list=rooms.findByPlaceId(placeId).stream().sorted(Comparator.comparing(RoomType::getId)).toList();
        if(list.isEmpty()) throw bad("Homestay chưa có loại phòng nào.");
        int bookedDays=0;
        for(RoomType r:list) {
            RoomType room=rooms.findLockedById(r.getId()).orElseThrow();
            for(LocalDate date=input.startDate();date.isBefore(input.endDate());date=date.plusDays(1)) {
                var day=calendar.lockedDay(room,date);
                if(input.stopSell() && day.getHeldRooms()+day.getConfirmedRooms()>0) bookedDays++;
                day.setStopSell(input.stopSell());
                day.setBlockReason(input.stopSell()?reason:(day.getTotalRooms()<room.getTotalRoomCount()?day.getBlockReason():null));
                day.setUpdatedAt(java.time.LocalDateTime.now());
            }
        }
        audit.record(actor,input.stopSell()?"HOMESTAY_CLOSE_DAYS":"HOMESTAY_OPEN_DAYS",PartnerAuditRecorder.HOMESTAY,placeId,reason,null,
                Map.of("startDate",input.startDate().toString(),"endDate",input.endDate().toString(),"roomTypes",list.size()));
        return bookedDays;
    }
    public List<ChangeLogDto> changeLog(UserPrincipal p,Long placeId) {
        homestays.owned(placeId,homestays.actor(p,false),false);
        return audit.forHomestay(placeId,rooms.findByPlaceId(placeId).stream().map(RoomType::getId).toList());
    }
    /** Ngừng bán hoặc giảm số phòng bắt buộc có lý do; mở bán lại thì xóa lý do. */
    private static String blockReason(boolean blocking,String reason) {
        String clean=reason==null||reason.isBlank()?null:reason.trim();
        if(blocking && clean==null) throw bad("Vui lòng nhập lý do ngừng bán hoặc giảm số phòng (bảo trì, phòng hỏng, nghỉ phục vụ...).");
        return blocking?clean:null;
    }
    private static Map<String,Object> roomSnapshot(RoomType r) {
        Map<String,Object> m=new LinkedHashMap<>();
        m.put("name",r.getName()); m.put("status",r.getStatus()); m.put("totalRoomCount",r.getTotalRoomCount()); m.put("maxOccupancy",r.getMaxOccupancy());
        m.put("basePrice",r.getBasePrice()==null?null:r.getBasePrice().toPlainString());
        m.put("weekendPrice",r.getWeekendPrice()==null?null:r.getWeekendPrice().toPlainString());
        return m;
    }
    private static Map<String,Object> priceSnapshot(RoomSpecialPrice p) {
        Map<String,Object> m=new LinkedHashMap<>();
        m.put("name",p.getName()); m.put("periodStart",String.valueOf(p.getPeriodStart())); m.put("periodEnd",String.valueOf(p.getPeriodEnd()));
        m.put("price",p.getPrice()==null?null:p.getPrice().toPlainString());
        return m;
    }
    private static ResponseStatusException bad(String text) {return new ResponseStatusException(HttpStatus.BAD_REQUEST,text);}
}
