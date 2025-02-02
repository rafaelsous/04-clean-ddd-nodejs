import { Either } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeAnswer } from 'test/factories/make-answer'
import { makeAnswerAttachment } from 'test/factories/make-answer-attachment'
import { InMemoryAnswerAttachmentsRepository } from 'test/repositories/in-memory/in-memory-answer-attachments-repository'
import { InMemoryAnswersRepository } from 'test/repositories/in-memory/in-memory-answers-repository'
import { Answer } from '../../enterprise/entities/answer'
import { EditAnswerUseCase } from './edit-answer'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

let answersRepository: InMemoryAnswersRepository
let answerAttachmentsRepository: InMemoryAnswerAttachmentsRepository
let sut: EditAnswerUseCase // system under test

describe('Edit Answer Use Case', () => {
  beforeEach(() => {
    answerAttachmentsRepository = new InMemoryAnswerAttachmentsRepository()
    answersRepository = new InMemoryAnswersRepository(
      answerAttachmentsRepository,
    )
    sut = new EditAnswerUseCase(answersRepository, answerAttachmentsRepository)
  })

  it('should be able to edit a answer successfully', async () => {
    const answer = makeAnswer(
      {
        authorId: new UniqueEntityID('author-01'),
        content: 'some content',
      },
      new UniqueEntityID('answer-01'),
    )

    await answersRepository.create(answer)

    answerAttachmentsRepository.answerAttachments.push(
      makeAnswerAttachment({
        answerId: answer.id,
        attachmentId: new UniqueEntityID('1'),
      }),
      makeAnswerAttachment({
        answerId: answer.id,
        attachmentId: new UniqueEntityID('2'),
      }),
    )

    const result = (await sut.execute({
      authorId: 'author-01',
      answerId: 'answer-01',
      content: 'new content',
      attachmentsIds: ['1', '3'],
    })) as Either<null, { answer: Answer }>

    expect(result.isRight()).toBe(true)
    expect(result.value?.answer).toMatchObject({
      content: result.value?.answer.content,
    })
    expect(result.value?.answer.attachments.currentItems).toHaveLength(2)
    expect(result.value?.answer.attachments.currentItems).toEqual([
      expect.objectContaining({ attachmentId: new UniqueEntityID('1') }),
      expect.objectContaining({ attachmentId: new UniqueEntityID('3') }),
    ])
  })

  it('should not be able to edit a answer when it not exists', async () => {
    const result = await sut.execute({
      authorId: 'author-01',
      answerId: 'answer-01',
      content: 'new content',
      attachmentsIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to edit a answer from another author', async () => {
    const answer = makeAnswer(
      {
        authorId: new UniqueEntityID('author-01'),
        content: 'some content',
      },
      new UniqueEntityID('answer-01'),
    )

    await answersRepository.create(answer)

    const result = await sut.execute({
      authorId: 'another-author-id',
      answerId: 'answer-01',
      content: 'new content',
      attachmentsIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(Error)
  })
})
