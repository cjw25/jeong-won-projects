package com.plandoseediary.controller;

import com.plandoseediary.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @GetMapping(
            value = "/export",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Map<String, Object>> export() {

        Map<String, Object> data =
                exportService.exportAll();

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"plan-do-see-export.json\""
                )
                .contentType(MediaType.APPLICATION_JSON)
                .body(data);
    }
}