package model

import (
	"time"
)

type MediaMark struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	UserId       uint      `json:"user_id" gorm:"index"`
	Fingerprint  string    `json:"fingerprint" gorm:"index"`
	StorageId    uint      `json:"storage_id"`
	OriginalPath string    `json:"original_path"`
	TimeSecond   float64   `json:"time_second"`
	Title        string    `json:"title"`
	Content      string    `json:"content" gorm:"type:text"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// MediaMarkDTO is used for API responses to avoid exposing internal fields
type MediaMarkDTO struct {
	ID         uint    `json:"id"`
	TimeSecond float64 `json:"time_second"`
	Title      string  `json:"title"`
	Content    string  `json:"content"`
}

// ToDTO converts MediaMark to MediaMarkDTO
func (m *MediaMark) ToDTO() MediaMarkDTO {
	return MediaMarkDTO{
		ID:         m.ID,
		TimeSecond: m.TimeSecond,
		Title:      m.Title,
		Content:    m.Content,
	}
}
