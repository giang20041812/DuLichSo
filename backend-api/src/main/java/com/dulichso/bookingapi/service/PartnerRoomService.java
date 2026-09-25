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
                r.getPrivateBathroom(),r.getAreaSqm(),r.getBasePrice(),r.getStatus(),r.getViewDescription(),
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
        if(roomId!=null && input.totalRoomCount()<room.getTotalRoomCount()) {
            Long oversized=em.createQuery("select count(d) from RoomInventoryDay d where d.roomType.id=:id and d.id.stayDate>=:today and d.heldRooms+d.confirmedRooms>:count",Long.class)
                    .setParameter("id",roomId).setParameter("today",LocalDate.now()).setParameter("count",input.totalRoomCount()).getSingleResult();
            if(oversized>0) throw bad("Không thể giảm số phòng xuống dưới số phòng đã giữ hoặc xác nhận.");
        }
        room.setName(input.name().trim()); room.setDescription(input.description()); room.setMaxOccupancy(input.maxOccupancy());
        room.setTotalRoomCount(input.totalRoomCount()); room.setAreaSqm(input.areaSqm()); room.setPrivateBathroom(input.privateBathroom());
        room.setBasePrice(input.basePrice()); room.setStatus(input.status()); room.setViewDescription(input.viewDescription());
        if(roomId==null) em.persist(room);
        em.createQuery("delete from RoomBed b where b.roomType.id=:id").setParameter("id",room.getId()).executeUpdate();
        em.createQuery("delete from RoomAmenity a where a.roomType.id=:id").setParameter("id",room.getId()).executeUpdate();
        for(BedDto bed:input.beds()) em.persist(RoomBed.builder().roomType(room).bedType(bed.bedType().trim()).quantity(bed.quantity()).build());
        for(Amenity a:selected) em.persist(RoomAmenity.builder().id(new RoomAmenityId(room.getId(),a.getId())).roomType(room).amenity(a).value(AmenityValue.YES).build());
        em.flush();
        // Refresh reference prices used by the public homestay cards.
        Object[] range=em.createQuery("select min(r.basePrice),max(r.basePrice) from RoomType r where r.place.id=:id and r.status='ACTIVE'",Object[].class).setParameter("id",placeId).getSingleResult();
        place.setPriceRefMin((java.math.BigDecimal)range[0]); place.setPriceRefMax((java.math.BigDecimal)range[1]); place.setPriceUnitNote("đêm");
        return new RoomDto(room.getId(),placeId,room.getName(),room.getDescription(),room.getMaxOccupancy(),room.getTotalRoomCount(),room.getPrivateBathroom(),room.getAreaSqm(),room.getBasePrice(),room.getStatus(),room.getViewDescription(),input.beds(),input.amenityIds());
    }
    public List<PriceDto> prices(UserPrincipal p,Long placeId,Long id) {
        owned(p,placeId,id,false);
        return em.createQuery("select p from RoomSpecialPrice p where p.roomType.id=:id order by p.periodStart",RoomSpecialPrice.class).setParameter("id",id)
                .getResultStream().map(v->new PriceDto(v.getId(),v.getName(),v.getPeriodStart(),v.getPeriodEnd(),v.getPrice())).toList();
    }
    @Transactional
    public PriceDto savePrice(UserPrincipal p,Long placeId,Long id,Long priceId,PriceInput input) {
        RoomType room=owned(p,placeId,id,true);
        if(input.periodEnd().isBefore(input.periodStart())) throw bad("Ngày kết thúc giá phải bằng hoặc sau ngày bắt đầu.");
        Long overlap=em.createQuery("select count(p) from RoomSpecialPrice p where p.roomType.id=:room and p.periodStart<=:end and p.periodEnd>=:start and (:id is null or p.id<>:id)",Long.class)
                .setParameter("room",id).setParameter("start",input.periodStart()).setParameter("end",input.periodEnd()).setParameter("id",priceId).getSingleResult();
        if(overlap>0) throw bad("Khoảng giá bị trùng với một bảng giá đã có.");
        RoomSpecialPrice price=priceId==null?RoomSpecialPrice.builder().roomType(room).createdBy(homestays.actor(p,true)).build():em.find(RoomSpecialPrice.class,priceId);
        if(price==null || !price.getRoomType().getId().equals(id)) throw bad("Không tìm thấy bảng giá.");
        price.setName(input.name().trim()); price.setPeriodStart(input.periodStart()); price.setPeriodEnd(input.periodEnd()); price.setPrice(input.price());
        if(priceId==null) em.persist(price);
        return new PriceDto(price.getId(),price.getName(),price.getPeriodStart(),price.getPeriodEnd(),price.getPrice());
    }
    @Transactional
    public void deletePrice(UserPrincipal p,Long placeId,Long id,Long priceId) {
        owned(p,placeId,id,true);
        RoomSpecialPrice price=em.find(RoomSpecialPrice.class,priceId);
        if(price==null || !price.getRoomType().getId().equals(id)) throw bad("Không tìm thấy bảng giá.");
        em.remove(price);
    }
    public List<InventoryDto> calendar(UserPrincipal p,Long placeId,Long id,LocalDate start,LocalDate end) {return calendar.calendar(owned(p,placeId,id,false),start,end);}
    public QuoteDto quote(UserPrincipal p,Long placeId,Long id,LocalDate start,LocalDate end,int rooms,int guests) {return calendar.quote(owned(p,placeId,id,false),start,end,rooms,guests);}
    @Transactional
    public void inventory(UserPrincipal p,Long placeId,Long id,InventoryInput input) {
        RoomType room=owned(p,placeId,id,true); RoomCalendarService.validateDates(input.startDate(),input.endDate());
        if(input.startDate().isBefore(LocalDate.now())) throw bad("Không sửa tồn phòng trong quá khứ.");
        if(input.totalRooms()>room.getTotalRoomCount()) throw bad("Tồn phòng không được vượt tổng số phòng của loại phòng.");
        for(LocalDate date=input.startDate();date.isBefore(input.endDate());date=date.plusDays(1)) {
            var day=calendar.lockedDay(room,date);
            if(input.totalRooms()<day.getHeldRooms()+day.getConfirmedRooms()) throw bad("Ngày "+date+" đã có nhiều phòng được giữ/xác nhận hơn số nhập vào.");
            day.setTotalRooms(input.totalRooms()); day.setStopSell(input.stopSell());
        }
    }
    private static ResponseStatusException bad(String text) {return new ResponseStatusException(HttpStatus.BAD_REQUEST,text);}
}
