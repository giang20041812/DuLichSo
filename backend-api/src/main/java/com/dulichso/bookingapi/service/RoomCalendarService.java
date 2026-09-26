package com.dulichso.bookingapi.service;

import com.dulichso.bookingapi.dto.partner.PartnerRoomDtos.*;
import com.dulichso.bookingapi.entity.*;
import com.dulichso.bookingapi.entity.keys.RoomInventoryDayId;
import com.dulichso.bookingapi.repository.RoomInventoryDayRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class RoomCalendarService {
    private final EntityManager em;
    private final RoomInventoryDayRepository inventory;

    public static void validateDates(LocalDate start, LocalDate end) {
        if (start == null || end == null || !end.isAfter(start) || ChronoUnit.DAYS.between(start,end) > 366)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Khoảng ngày phải từ 1 đến 366 đêm, không tính ngày trả phòng.");
    }
    @Transactional(readOnly=true)
    public List<InventoryDto> calendar(RoomType room, LocalDate start, LocalDate end) {
        validateDates(start,end);
        Map<LocalDate,RoomInventoryDay> days = em.createQuery("select d from RoomInventoryDay d where d.roomType.id=:id and d.id.stayDate>=:start and d.id.stayDate<:end",RoomInventoryDay.class)
                .setParameter("id",room.getId()).setParameter("start",start).setParameter("end",end).getResultStream()
                .collect(Collectors.toMap(d->d.getId().getStayDate(), Function.identity()));
        List<RoomSpecialPrice> prices = em.createQuery("select p from RoomSpecialPrice p where p.roomType.id=:id and p.periodStart<:end and p.periodEnd>=:start order by p.id",RoomSpecialPrice.class)
                .setParameter("id",room.getId()).setParameter("start",start).setParameter("end",end).getResultList();
        List<InventoryDto> result = new ArrayList<>();
        for (LocalDate date=start; date.isBefore(end); date=date.plusDays(1)) {
            RoomInventoryDay d=days.get(date);
            int total=d==null?room.getTotalRoomCount():d.getTotalRooms();
            int held=d==null?0:d.getHeldRooms(), confirmed=d==null?0:d.getConfirmedRooms();
            boolean stopped=!"ACTIVE".equals(room.getStatus()) || (d!=null && Boolean.TRUE.equals(d.getStopSell()));
            BigDecimal price=room.getBasePrice();
            if (room.getWeekendPrice() != null && (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY)) {
                price = room.getWeekendPrice();
            }
            for (RoomSpecialPrice p:prices) if (!date.isBefore(p.getPeriodStart()) && !date.isAfter(p.getPeriodEnd())) price=p.getPrice();
            if (price==null) throw new ResponseStatusException(HttpStatus.CONFLICT,"Loại phòng chưa có giá.");
            result.add(new InventoryDto(date,total,held,confirmed,stopped?0:Math.max(0,total-held-confirmed),stopped,price,d==null?null:d.getBlockReason()));
        }
        return result;
    }
    /** Caller must lock the parent RoomType first, including when a day's row does not exist yet. */
    public RoomInventoryDay lockedDay(RoomType room, LocalDate date) {
        return inventory.findByIdForUpdate(room.getId(),date).orElseGet(()->inventory.saveAndFlush(RoomInventoryDay.builder()
                .id(new RoomInventoryDayId(room.getId(),date)).roomType(room).totalRooms(room.getTotalRoomCount()).build()));
    }
    @Transactional(readOnly=true)
    public QuoteDto quote(RoomType room, LocalDate start, LocalDate end, int roomCount, int guestCount) {
        if(roomCount<1 || guestCount<1) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Số phòng và số khách phải lớn hơn 0.");
        var days=calendar(room,start,end);
        int available=days.stream().mapToInt(InventoryDto::availableRooms).min().orElse(0);
        return new QuoteDto(room.getId(), available,available>=roomCount && (long)room.getMaxOccupancy()*roomCount>=guestCount,
                days.stream().map(InventoryDto::price).reduce(BigDecimal.ZERO,BigDecimal::add).multiply(BigDecimal.valueOf(roomCount)),days);
    }
}
