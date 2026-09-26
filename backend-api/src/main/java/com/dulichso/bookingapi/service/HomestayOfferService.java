package com.dulichso.bookingapi.service;
import com.dulichso.bookingapi.dto.partner.HomestayServiceDtos.*;
import com.dulichso.bookingapi.entity.HomestayServiceOffer;
import com.dulichso.bookingapi.security.UserPrincipal;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class HomestayOfferService {
    private final EntityManager em;
    private final PartnerHomestayService homestays;
    public List<ServiceDto> list(UserPrincipal principal,Long placeId) {homestays.owned(placeId,homestays.actor(principal,false),false);return query(placeId,false);}
    public List<ServiceDto> publicList(Long placeId) {return query(placeId,true);}
    private List<ServiceDto> query(Long placeId,boolean onlyActive) {
        return em.createQuery("select s from HomestayServiceOffer s where s.place.id=:id and (:active=false or s.active=true) order by s.id",HomestayServiceOffer.class)
                .setParameter("id",placeId).setParameter("active",onlyActive).getResultStream().map(this::dto).toList();
    }
    @Transactional public ServiceDto save(UserPrincipal p,Long placeId,Long id,Input input) {
        var place=homestays.owned(placeId,homestays.actor(p,true),true);
        var service=id==null?new HomestayServiceOffer():em.find(HomestayServiceOffer.class,id);
        if(service==null || (id!=null&&!service.getPlace().getId().equals(placeId))) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy dịch vụ.");
        service.setPlace(place);service.setName(input.name().trim());service.setDescription(input.description());service.setPrice(input.price());service.setPriceUnit(input.priceUnit());service.setActive(input.active());
        if(id==null) em.persist(service);return dto(service);
    }
    private ServiceDto dto(HomestayServiceOffer s) {return new ServiceDto(s.getId(),s.getName(),s.getDescription(),s.getPrice(),s.getPriceUnit(),s.isActive());}
}
