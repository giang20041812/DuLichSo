package com.dulichso.bookingapi.dto;

import java.math.BigDecimal;

public record BookingQuoteResponse(Long roomTypeId, int availableRooms, boolean suitable, BigDecimal totalAmount) {}
